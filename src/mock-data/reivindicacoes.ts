export type ClaimStatus = "pending" | "approved" | "rejected";
export type ProfileStatus = "approved" | "pending" | null;

export interface Reivindicacao {
  id: string;
  authorName: string;
  authorPhoto: string;
  authorSlug: string;
  claimedBy: string | null;
  email: string | null;
  verificationInfo: string | null;
  profileStatus: ProfileStatus;
  claimedDate: string;
  claimStatus: ClaimStatus;
}

export const reivindicacoes: Reivindicacao[] = [
  {
    id: "1",
    authorName: "Vicente Sitoe",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
    authorSlug: "vicente-sitoe",
    claimedBy: "Admin",
    email: "admin@catalogus.co.mz",
    verificationInfo: "Ver detalhes",
    profileStatus: null,
    claimedDate: "1/31/2026",
    claimStatus: "rejected",
  },
  {
    id: "2",
    authorName: "Fujitora",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
    authorSlug: "fujitora",
    claimedBy: "Fujitora",
    email: "fujitorarn@gmail.com",
    verificationInfo: null,
    profileStatus: "approved",
    claimedDate: "1/13/2026",
    claimStatus: "approved",
  },
  {
    id: "3",
    authorName: "Olimpio Adolfo",
    authorPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
    authorSlug: "olimpio-adolfo",
    claimedBy: "Olimpio Adolfo",
    email: "olymangue@gmail.com",
    verificationInfo: null,
    profileStatus: "approved",
    claimedDate: "1/13/2026",
    claimStatus: "approved",
  },
  {
    id: "4",
    authorName: "Adelino Timóteo",
    authorPhoto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&h=50&fit=crop",
    authorSlug: "adelino-timoteo",
    claimedBy: null,
    email: null,
    verificationInfo: null,
    profileStatus: null,
    claimedDate: "1/10/2026",
    claimStatus: "rejected",
  },
];

export const reivindicacoesStats = {
  pending: 0,
  approved: 2,
  rejected: 2,
  total: 4,
};
