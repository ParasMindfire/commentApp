import { DataTypes } from "sequelize";
import { sequelize } from "../config/db";

export const comment=sequelize.define('comment',{
    comment_id:{
        type:DataTypes.INTEGER,
        // autoIncrement:true,
        allowNull:false,
    },
    user_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    post_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    text:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    is_reply:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
    },
    reply_count:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    vote_count:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    }
},{
    createdAt:false,
    updatedAt:false,
    tableName:'comments'
})