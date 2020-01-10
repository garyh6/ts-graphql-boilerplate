import * as yup from "yup";
import {
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from "./modules/register/errorMessage";

export const registerEmailValidation = yup
  .string()
  .min(3, emailNotLongEnough)
  .max(255)
  .email(invalidEmail);

export const registerPasswordValidation = yup
  .string()
  .min(3, passwordNotLongEnough)
  .max(255);
