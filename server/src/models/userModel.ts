import { DataTypes } from "sequelize";
import { sequelize } from "../config/db";

export const user=sequelize.define('user',{
    user_id:{
        type:DataTypes.INTEGER,
        // autoIncrement:true,
        allowNull:false,
    },
    user_name:{
        type:DataTypes.STRING,
        allowNull:false,
    }
},{
    createdAt:true,
    updatedAt:true,
    tableName:'users'
})