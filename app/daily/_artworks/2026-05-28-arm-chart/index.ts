import type { DailyArtworkModule } from "@/app/daily/_lib/daily-types";
import { profile } from "./profile";
import Artwork from "./artwork";

const module_: DailyArtworkModule = { profile, Artwork };
export default module_;
