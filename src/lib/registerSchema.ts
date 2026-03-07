import { z } from "zod";

// Football (PPL): goalkeeper, defender, midfielder, forward, winger
// Cricket (PCL): batter, bowler, all-rounder, wicket-keeper
// Volleyball (PVL): setter, outside hitter, opposite hitter, middle blocker, libero, defensive specialist
const positionEnum = z.enum([
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
  "winger",
  "batter",
  "bowler",
  "allRounder",
  "wicketKeeper",
  "setter",
  "outsideHitter",
  "oppositeHitter",
  "middleBlocker",
  "libero",
  "defensiveSpecialist",
]);

/** Schema for PPL, PCL, PVL (franchise owner is the player) */
export const defaultRegisterSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  teamLogoBase64: z.string().min(1, "Please upload team logo"),
  franchiseOwnerName: z.string().min(1, "Franchise owner name is required"),
  franchiseOwnerEmail: z.string().email("Valid franchise owner email is required"),
  franchiseOwnerWhatsApp: z.string(),
  franchiseOwnerPhotoBase64: z.string().min(1, "Please upload franchise owner photo"),
  franchiseOwnerPosition: positionEnum,
  franchiseOwnerAadhaarFrontBase64: z.string().min(1, "Aadhaar front image is required"),
  franchiseOwnerAadhaarBackBase64: z.string().min(1, "Aadhaar back image is required"),
  franchiseOwnerDateOfBirth: z.string().min(1, "Date of birth is required"),
  franchiseOwnerPaymentScreenshotBase64: z.string().min(1, "Player registration payment (₹200) proof is required for this league"),
  teamRegistrationPaymentBase64: z.string().min(1, "Team registration payment proof is required"),
  sponsorName: z.string(),
  sponsorLogoBase64: z.string(),
  declarationAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must accept the declaration",
    }),
}).refine(
  (data) => {
    const dob = data.franchiseOwnerDateOfBirth;
    if (!dob) return true;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 16;
  },
  { message: "Franchise owner must be at least 16 years old", path: ["franchiseOwnerDateOfBirth"] }
);

/** Schema for PBL (two players, one owner with email) */
export const pblRegisterSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  teamLogoBase64: z.string().min(1, "Please upload team logo"),
  player1Name: z.string().min(1, "Player 1 name is required"),
  player1PhotoBase64: z.string().min(1, "Player 1 photo is required"),
  player1Email: z.string().email("Invalid email").optional().or(z.literal("")),
  player1WhatsApp: z.string(),
  player1AadhaarFrontBase64: z.string(),
  player1AadhaarBackBase64: z.string(),
  player1DateOfBirth: z.string(),
  player1PaymentScreenshotBase64: z.string(),
  player2Name: z.string().min(1, "Player 2 name is required"),
  player2PhotoBase64: z.string().min(1, "Player 2 photo is required"),
  player2Email: z.string().email("Invalid email").optional().or(z.literal("")),
  player2WhatsApp: z.string(),
  player2AadhaarFrontBase64: z.string(),
  player2AadhaarBackBase64: z.string(),
  player2DateOfBirth: z.string(),
  player2PaymentScreenshotBase64: z.string(),
  ownerEmail: z.string().email("Valid owner email is required"),
  ownerPlayerIndex: z.union([z.literal(0), z.literal(1)]),
  teamRegistrationPaymentBase64: z.string().min(1, "Team registration payment proof is required"),
  sponsorName: z.string(),
  sponsorLogoBase64: z.string(),
  declarationAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must accept the declaration",
    }),
});

export type DefaultRegisterValues = z.infer<typeof defaultRegisterSchema>;
export type PblRegisterValues = z.infer<typeof pblRegisterSchema>;

/** Form values type used in the page (all fields for both flows) */
export type RegisterFormValues = Partial<DefaultRegisterValues & PblRegisterValues>;

/** Default values for the combined form */
export const defaultRegisterFormValues: RegisterFormValues = {
  teamName: "",
  teamLogoBase64: "",
  franchiseOwnerName: "",
  franchiseOwnerEmail: "",
  franchiseOwnerWhatsApp: "",
  franchiseOwnerPhotoBase64: "",
  franchiseOwnerPosition: "forward",
  franchiseOwnerAadhaarFrontBase64: "",
  franchiseOwnerAadhaarBackBase64: "",
  franchiseOwnerDateOfBirth: "",
  franchiseOwnerPaymentScreenshotBase64: "",
  teamRegistrationPaymentBase64: "",
  player1Name: "",
  player1PhotoBase64: "",
  player1Email: "",
  player1WhatsApp: "",
  player1AadhaarFrontBase64: "",
  player1AadhaarBackBase64: "",
  player1DateOfBirth: "",
  player1PaymentScreenshotBase64: "",
  player2Name: "",
  player2PhotoBase64: "",
  player2Email: "",
  player2WhatsApp: "",
  player2AadhaarFrontBase64: "",
  player2AadhaarBackBase64: "",
  player2DateOfBirth: "",
  player2PaymentScreenshotBase64: "",
  ownerEmail: "",
  ownerPlayerIndex: 0,
  sponsorName: "",
  sponsorLogoBase64: "",
  declarationAccepted: false,
};
