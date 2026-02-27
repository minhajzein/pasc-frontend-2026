import { z } from "zod";

const positionEnum = z.enum(["goalkeeper", "forward", "defender"]);

/** Schema for PPL, PCL, PVL (manager + icon player) */
export const defaultRegisterSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  teamLogoBase64: z.string().min(1, "Please upload team logo"),
  managerName: z.string().min(1, "Manager name is required"),
  managerEmail: z.string().email("Valid manager email is required"),
  managerWhatsApp: z.string(),
  managerIsPlayer: z.boolean(),
  managerPhotoBase64: z.string().min(1, "Please upload manager photo"),
  iconPlayerName: z.string().min(1, "Icon player name is required"),
  iconPlayerPhotoBase64: z.string().min(1, "Icon player photo is required"),
  iconPlayerPosition: positionEnum,
  sponsorName: z.string(),
  sponsorLogoBase64: z.string(),
  declarationAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must accept the declaration",
    }),
});

/** Schema for PBL (two players, one owner with email) */
export const pblRegisterSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  teamLogoBase64: z.string().min(1, "Please upload team logo"),
  player1Name: z.string().min(1, "Player 1 name is required"),
  player1PhotoBase64: z.string().min(1, "Player 1 photo is required"),
  player2Name: z.string().min(1, "Player 2 name is required"),
  player2PhotoBase64: z.string().min(1, "Player 2 photo is required"),
  ownerEmail: z.string().email("Valid owner email is required"),
  ownerPlayerIndex: z.union([z.literal(0), z.literal(1)]),
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
  managerName: "",
  managerEmail: "",
  managerWhatsApp: "",
  managerIsPlayer: false,
  managerPhotoBase64: "",
  iconPlayerName: "",
  iconPlayerPhotoBase64: "",
  iconPlayerPosition: "forward",
  player1Name: "",
  player1PhotoBase64: "",
  player2Name: "",
  player2PhotoBase64: "",
  ownerEmail: "",
  ownerPlayerIndex: 0,
  sponsorName: "",
  sponsorLogoBase64: "",
  declarationAccepted: false,
};
