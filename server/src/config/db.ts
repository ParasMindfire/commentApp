import { Sequelize } from "sequelize";

export const sequelize = new Sequelize('comment_db', 'root', 'Pa1ra2@3', {
  host: '127.0.0.1',
  dialect: 'mysql'
});

export const connectDB=async()=>{
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

