export interface IComment {
  comment_id: number;
  user_id: number;
  post_id: number;
  text: string;
  is_reply: boolean;
  reply_count: number; // Depth of the comment
  vote_count: number;
  parent_id: number | null; // Crucial for threading: ID of the comment this is a reply to
  createdAt?: string; // Assuming backend provides this
  updatedAt?: string; // Assuming backend provides this
  authorName?: string; // To be populated client-side or by backend
  is_deleted?: boolean; // For client-side handling of deleted comments
}

export interface ICommentFE extends IComment {
  children: ICommentFE[];
  authorName: string; // Ensure it's always present on FE
}

export interface CreateCommentPayload {
  parent_comment_id: number | null; // ID of the comment being replied to, null for top-level
  user_id: number;
  post_id: number;
  text: string;
}

// For the actual API call based on your backend structure
export interface BackendCreateCommentPayload {
    comment_id: number; // ID of the new comment itself
    user_id: number;
    post_id: number;
    is_reply: boolean;
    reply_count: number; // depth
    vote_count: number;
    text: string;
}

export interface UpdateVotePayload {
  comment_id: number;
  vote_count: number;
}