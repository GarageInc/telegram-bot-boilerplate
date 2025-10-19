import mongoose, { Schema, Document } from "mongoose";

// Post interface
export interface IPost extends Document {
	_id: string;
	authorId: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

// Comment interface
export interface IComment extends Document {
	_id: string;
	postId: string;
	authorId: string;
	parentId: string | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

// Post schema
const PostSchema = new Schema<IPost>(
	{
		authorId: {
			type: String,
			required: true,
			index: true,
		},
		content: {
			type: String,
			required: true,
			maxlength: 4000,
		},
	},
	{
		timestamps: true,
		collection: "posts",
	}
);

// Comment schema
const CommentSchema = new Schema<IComment>(
	{
		postId: {
			type: String,
			required: true,
			index: true,
		},
		authorId: {
			type: String,
			required: true,
			index: true,
		},
		parentId: {
			type: String,
			default: null,
			index: true,
		},
		content: {
			type: String,
			required: true,
			maxlength: 2000,
		},
	},
	{
		timestamps: true,
		collection: "comments",
	}
);

// Indexes for better query performance
PostSchema.index({ createdAt: -1 });
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ postId: 1, parentId: 1 });

// Models
export const Post = mongoose.model<IPost>("Post", PostSchema);
export const Comment = mongoose.model<IComment>("Comment", CommentSchema);

