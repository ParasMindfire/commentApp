import {post} from './postModel';
import {comment} from './commentModel';
import {user} from './userModel';

const syncTables = async () => {
  await post.sync({ alter: true });
  console.log('post Table synced successfully.');

  await comment.sync({ alter: true });
  console.log('comment Table synced successfully.');

  await user.sync({ alter: true });
  console.log('user Table synced successfully.');
};

export default syncTables;