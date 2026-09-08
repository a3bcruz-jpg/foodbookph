CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELED');
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'CONNECTIONS', 'PRIVATE');

CREATE TABLE "UserPrivacy" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
  "discoverable" BOOLEAN NOT NULL DEFAULT true,
  "showActivity" BOOLEAN NOT NULL DEFAULT true,
  "allowFriendRequests" BOOLEAN NOT NULL DEFAULT true,
  "allowFollows" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPrivacy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FriendRequest" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Friendship" (
  "id" TEXT NOT NULL,
  "userAId" TEXT NOT NULL,
  "userBId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserFollow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Block" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPrivacy_userId_key" ON "UserPrivacy"("userId");
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");
CREATE INDEX "FriendRequest_receiverId_status_createdAt_idx" ON "FriendRequest"("receiverId", "status", "createdAt");
CREATE INDEX "FriendRequest_senderId_status_createdAt_idx" ON "FriendRequest"("senderId", "status", "createdAt");
CREATE UNIQUE INDEX "Friendship_userAId_userBId_key" ON "Friendship"("userAId", "userBId");
CREATE INDEX "Friendship_userBId_createdAt_idx" ON "Friendship"("userBId", "createdAt");
CREATE UNIQUE INDEX "UserFollow_followerId_followedId_key" ON "UserFollow"("followerId", "followedId");
CREATE INDEX "UserFollow_followedId_createdAt_idx" ON "UserFollow"("followedId", "createdAt");
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

ALTER TABLE "UserPrivacy" ADD CONSTRAINT "UserPrivacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
