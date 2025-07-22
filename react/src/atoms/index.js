import { atom } from "recoil";

export const authAtom = atom({
  key: "authAtom",
  default: {
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user")) || null,
  },
});

export const codeAtom = atom({
  key: "codeAtom",
  default: "",
});

export const outputAtom = atom({
  key: "outputAtom",
  default: {
    output: "",
    imageUrl: null,
    error: null,
  },
});
