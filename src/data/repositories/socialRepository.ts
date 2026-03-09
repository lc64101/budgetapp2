export interface LeaderboardRow {
  userId: string;
  username: string;
  score: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface SocialRepository {
  getLeaderboard(userId: string): Promise<LeaderboardRow[]>;
  getPendingFriendRequests(userId: string): Promise<FriendRequest[]>;
}
