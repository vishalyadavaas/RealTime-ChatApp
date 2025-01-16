const { default: cloudinary } = require('../lib/cloudinary');
const { getReceiverSocket,io } = require('../lib/socket');

const Message = require('../models/message.model');
const User = require('../models/user.model');

exports.getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { id:userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ]
        })

        res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });  
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const {text,image} = req.body;
        const { id:receiverId } = req.params;
        const senderId = req.user._id;       

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        // todo realtime fuctionality goes here => socket.io
        const receiverSocketId = getReceiverSocket(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};