export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  trend: "better" | "worse" | "same";
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  fromUsername: string;
}

export interface SendFriendRequestPayload {
  username: string;
}