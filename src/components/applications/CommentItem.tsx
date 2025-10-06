import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { User, Clock, Trash2, MoreVertical, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { Comment } from "@/types/comments";
import { useAuth } from "@/hooks/useAuth";

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
  isDeleting?: boolean;
  isClientView?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  isDeleting = false,
}) => {
  const { user } = useAuth();
  const isImportant =
    comment.is_important || comment.added_by.toLowerCase().includes("moshin");

  // Determine if current user can delete this comment
  const canDelete =
    user &&
    // Admin can delete any comment
    (user.role === "admin" ||
      user.role === "team_leader" ||
      user.role === "master_admin" ||
      user.role === "supervisor" ||
      (user.role === "client" && comment.added_by === user.username));

  // Determine if this is a client comment (different UI)
  const isClientComment =
    user && user.role === "client" && comment.added_by === user.username;
  const isAdminComment =
    user &&
    (user.role === "admin" ||
      user.role === "team_leader" ||
      user.role === "master_admin" ||
      user.role === "supervisor") &&
    comment.added_by === user.username;

  return (
    <Card
      className={`p-4 transition-all duration-200 hover:shadow-md ${
        isImportant
          ? "border-l-4 border-l-red-500 bg-gradient-to-r from-gray-50 to-red-50"
          : isClientComment
          ? "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50"
          : isAdminComment
          ? "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50"
          : "border-l-4 border-l-gray-300 bg-white"
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isImportant
              ? "bg-gradient-to-r from-gray-100 to-red-100"
              : isClientComment
              ? "bg-gradient-to-r from-blue-100 to-indigo-100"
              : isAdminComment
              ? "bg-gradient-to-r from-green-100 to-emerald-100"
              : "bg-gray-100"
          }`}
        >
          {isClientComment ? (
            <MessageSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <User
              className={`h-4 w-4 ${
                isImportant
                  ? "text-red-600"
                  : isAdminComment
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-semibold capitalize ${
                  isImportant
                    ? "text-red-900"
                    : isClientComment
                    ? "text-blue-900"
                    : isAdminComment
                    ? "text-green-900"
                    : "text-gray-900"
                }`}
              >
                {comment.added_by}
                {isClientComment && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
                {isAdminComment && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </span>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {/* Delete Button - Only for comments user can delete */}
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100 cursor-pointer"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-red-600 hover:bg-red-50 cursor-pointer hover:text-red-700"
                        disabled={isDeleting}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-3 w-3 mr-2 text-red-500" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this comment? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(comment._id)}
                          className="bg-red-600 cursor-pointer hover:bg-red-700"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p
            className={`text-sm leading-relaxed ${
              isImportant
                ? "text-purple-800"
                : isClientComment
                ? "text-blue-800"
                : isAdminComment
                ? "text-green-800"
                : "text-gray-700"
            }`}
          >
            {comment.comment}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CommentItem;
