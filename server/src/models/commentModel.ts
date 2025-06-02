import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

interface CommentAttributes {
    comment_id: number;
    user_id: number;
    post_id: number;
    parent_id?: number | null;
    text: string;
    vote_count: number;
    created_at?: Date;
    updated_at?: Date;
}

export class Comment extends Model<CommentAttributes> implements CommentAttributes {
    public comment_id!: number;
    public user_id!: number;
    public post_id!: number;
    public parent_id!: number | null;
    public text!: string;
    public vote_count!: number;
    public created_at!: Date;
    public updated_at!: Date;
}

Comment.init({
    comment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
            model: 'comments',
            key: 'comment_id'
        }
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    vote_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    sequelize,
    tableName: 'comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
