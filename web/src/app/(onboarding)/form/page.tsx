"use client";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store";
import { saveSubmitted, setStatus, setError } from "@/lib/store/slices/onboardingSlice";
import axios from "axios";
import { toast } from "sonner";
import { CelestialBackground } from "@/components/celestial/celestial-background";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";

type FormValues = {
  name: string;
  age: number;
  monthlyIncome: number;
  spouseIncome?: number;
  creditScore: "300-579" | "580-669" | "670-739" | "740-799" | "800-850";
  assets?: number;
  dailyMiles: number;
  preferences: {
    mode: "recommend" | "choose";
    carType?: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible";
    budget?: number;
    downPayment?: number;
    // New high-level inputs
    fuelPreference?: "any" | "gas" | "hybrid" | "electric";
    ownershipYears?: number;
    region?: string;
    usage?: "commute" | "family" | "haul" | "mixed";
    riskTolerance?: "low" | "medium" | "high";
  };
};

export default function OnboardingFormPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      age: 25,
      monthlyIncome: 5000,
      spouseIncome: undefined,
      creditScore: "670-739",
      assets: undefined,
      dailyMiles: 25,
      preferences: { mode: "recommend" },
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      dispatch(setStatus("saving"));
      // Save to Redux (last submitted)
      dispatch(saveSubmitted(values));
      // Send to API route
      const res = await axios.post("/api/onboarding", values);
      if (res.status >= 200 && res.status < 300) {
        toast.success("Onboarding saved!", { description: `ID: ${res.data.id}` });
        dispatch(setStatus("success"));
        // Redirect to finance path selection page
        setTimeout(() => {
          router.push("/path");
        }, 500);
      } else {
        throw new Error("Non-2xx response");
      }
    } catch (e: any) {
      dispatch(setStatus("error"));
      const serverMsg = e?.response?.data?.error as string | undefined;
      const msg = serverMsg || e?.message || "Failed to submit";
      dispatch(setError(msg));
      toast.error("Submission failed", { description: msg });
    }
  }

  const mode = watch("preferences.mode");

  return (
    <main className="relative mx-auto max-w-5xl px-6 py-10">
      <CelestialBackground />
      <section className="relative z-10 space-y-8">
        <PageHeader
          title="Tell us about you"
          subtitle="We'll chart your financing constellation"
        />

        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-300" /> Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Full name</label>
                  <Input placeholder="Your Name" {...register("name", { required: "Please enter your full name", minLength: { value: 2, message: "Name must be at least 2 characters" } })}/> 
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-300">{errors.name.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Age</label>
                  <Input type="number" min={18} {...register("age", { valueAsNumber: true, required: "Age is required", min: { value: 18, message: "You must be at least 18" } })} />
                  {errors.age && (
                    <p className="mt-1 text-xs text-red-300">{errors.age.message as string}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Monthly income ($)</label>
                  <Input type="number" min={0} step="100" {...register("monthlyIncome", { valueAsNumber: true, required: "Monthly income is required", min: { value: 0, message: "Income must be positive" } })} />
                  {errors.monthlyIncome && (
                    <p className="mt-1 text-xs text-red-300">{errors.monthlyIncome.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Spouse/partner income (optional)</label>
                  <Input type="number" min={0} step="100" {...register("spouseIncome", { valueAsNumber: true })} />
                  {errors.spouseIncome && (
                    <p className="mt-1 text-xs text-red-300">{errors.spouseIncome.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Credit score</label>
                  <Controller
                    control={control}
                    name="creditScore"
                    rules={{ required: "Please select your credit score band" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["300-579", "580-669", "670-739", "740-799", "800-850"] as const).map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.creditScore && (
                    <p className="mt-1 text-xs text-red-300">{errors.creditScore.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Total assets ($, optional)</label>
                  <Input type="number" min={0} step="500" {...register("assets", { valueAsNumber: true })} />
                  {errors.assets && (
                    <p className="mt-1 text-xs text-red-300">{errors.assets.message as string}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Daily miles</label>
                  <Input type="number" min={1} step="1" {...register("dailyMiles", { valueAsNumber: true, required: "Please provide estimated daily miles", min: { value: 1, message: "Must be at least 1 mile" } })} />
                  {errors.dailyMiles && (
                    <p className="mt-1 text-xs text-red-300">{errors.dailyMiles.message as string}</p>
                  )}
                </div>
              </div>

              <Separator />

              

              <div>
                <label className="mb-1 block text-sm font-medium">Car preference</label>
                <Controller
                  control={control}
                  name="preferences.mode"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-3 md:grid-cols-2"
                    >
                      <div className="flex items-center space-x-2 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                        <RadioGroupItem value="recommend" id="recommend" />
                        <label htmlFor="recommend" className="text-sm">
                          Let us recommend the best car for you
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                        <RadioGroupItem value="choose" id="choose" />
                        <label htmlFor="choose" className="text-sm">
                          I have specific car preferences
                        </label>
                      </div>
                    </RadioGroup>
                  )}
                />
                <p className="mt-1 text-xs text-white/60">Choose recommendation or specify your constraints.</p>
                {errors.preferences?.mode && (
                  <p className="mt-1 text-xs text-red-300">{errors.preferences.mode.message as string}</p>
                )}
              </div>

              {mode === "choose" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Car type</label>
                    <Controller
                      control={control}
                      name="preferences.carType"
                      rules={{ required: false }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {(["sedan", "suv", "truck", "coupe", "hatchback", "convertible"] as const).map(v => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.preferences?.carType && (
                      <p className="mt-1 text-xs text-red-300">{errors.preferences.carType.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Monthly budget ($)</label>
                    <Input type="number" min={0} step="50" {...register("preferences.budget", { valueAsNumber: true })} />
                    {errors.preferences?.budget && (
                      <p className="mt-1 text-xs text-red-300">{errors.preferences.budget.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Down payment ($)</label>
                    <Input type="number" min={0} step="500" {...register("preferences.downPayment", { valueAsNumber: true })} />
                    {errors.preferences?.downPayment && (
                      <p className="mt-1 text-xs text-red-300">{errors.preferences.downPayment.message as string}</p>
                    )}
                  </div>
                </div>
              )}

              {/* New high-level inputs */}
              <Separator className="bg-white/10" />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Fuel preference</label>
                  <Controller
                    control={control}
                    name="preferences.fuelPreference"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="gas">Gas</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Intended ownership (years)</label>
                  <Input type="number" min={1} max={15} {...register("preferences.ownershipYears", { valueAsNumber: true })} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Primary usage</label>
                  <Controller
                    control={control}
                    name="preferences.usage"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="commute">Commute</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="haul">Haul/Work</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Region (for fuel pricing)</label>
                  <Input placeholder="e.g., CA, TX" {...register("preferences.region")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Risk tolerance</label>
                  <Controller
                    control={control}
                    name="preferences.riskTolerance"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Estimated down payment (%)</label>
                  <Input type="number" min={0} max={100} {...register("preferences.downPayment", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500">
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
