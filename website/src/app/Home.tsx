import { Hero } from "@/sections/Hero";
import { WhatIs } from "@/sections/WhatIs";
import { Journey } from "@/sections/Journey";
import { Careers } from "@/sections/Careers";
import { Sourcing } from "@/sections/Sourcing";
import { Pipeline } from "@/sections/Pipeline";
import { CvSearch } from "@/sections/CvSearch";
import { Assessments } from "@/sections/Assessments";
import { Code } from "@/sections/Code";
import { Interviews } from "@/sections/Interviews";
import { Schedule } from "@/sections/Schedule";
import { Offers } from "@/sections/Offers";
import { Portal } from "@/sections/Portal";
import { Trust } from "@/sections/Trust";
import { Integrations } from "@/sections/Integrations";
import { Tour } from "@/sections/Tour";
import { Demo } from "@/sections/Demo";
import { CandidateTrace } from "@/ui/CandidateTrace";

/**
 * Home narrative. Order follows the candidate's journey:
 * discover → apply → (sourcing feeds applications) → pipeline → CV evidence
 * → assess → code → interview → schedule → offer → onboard → the candidate's
 * own portal, then the trust
 * layer, integrations, the real product, and the demo request.
 * Section ids / data-dock groups are the contract used by the Dock,
 * the mobile menu and the Candidate Trace.
 */
export function Home() {
  return (
    <>
      <CandidateTrace />
      <Hero />
      <WhatIs />
      <Journey />
      <Careers />
      <Sourcing />
      <Pipeline />
      <CvSearch />
      <Assessments />
      <Code />
      <Interviews />
      <Schedule />
      <Offers />
      <Portal />
      <Trust />
      <Integrations />
      <Tour />
      <Demo />
    </>
  );
}
