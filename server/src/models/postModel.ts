import { DataTypes } from "sequelize";
import { sequelize } from "../config/db";

export const post=sequelize.define('post',{
    post_id:{
        type:DataTypes.INTEGER,
        // autoIncrement:true,
        allowNull:false,
    },
    post_name:{
        type:DataTypes.STRING,
        allowNull:false,
    }
},{
    createdAt:true,
    updatedAt:true,
    tableName:'posts'
})