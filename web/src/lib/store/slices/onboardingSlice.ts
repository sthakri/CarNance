import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type OnboardingValues = {
  name: string;
  age: number;
  monthlyIncome: number;
  spouseIncome?: number;
  creditScore: "300-579" | "580-669" | "670-739" | "740-799" | "800-850";
  assets?: number;
  dailyMiles: number;
  financePath: "lease" | "buy" | "credit-build";
  preferences: {
    mode: "recommend" | "choose";
    carType?: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible";
    budget?: number;
    downPayment?: number;
  };
};

type Status = "idle" | "saving" | "success" | "error";

interface OnboardingState {
  lastSubmitted?: OnboardingValues;
  draft?: Partial<OnboardingValues>;
  status: Status;
  error?: string;
}

const initialState: OnboardingState = {
  status: "idle",
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setDraft(state, action: PayloadAction<Partial<OnboardingValues>>) {
      state.draft = { ...state.draft, ...action.payload };
    },
    clearDraft(state) {
      state.draft = undefined;
    },
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
    },
    saveSubmitted(state, action: PayloadAction<OnboardingValues>) {
      state.lastSubmitted = action.payload;
    },
  },
});

export const { setDraft, clearDraft, setStatus, setError, saveSubmitted } = onboardingSlice.actions;
export default onboardingSlice.reducer;
