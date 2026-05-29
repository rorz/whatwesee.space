import type { DailyArtworkModule } from "@/app/daily/_lib/daily-types";
import Artwork from "./artwork";
import { profile } from "./profile";

const dailyArtworkModule: DailyArtworkModule = { profile, Artwork };

export default dailyArtworkModule;
