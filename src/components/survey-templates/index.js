import Stack from "./templates/Stack";
import FullScreen from "./templates/FullScreen";
import Chat from "./templates/Chat";
import SinglePanel from "./templates/SinglePanel";
import SplitScreen from "./templates/SplitScreen";
import TileGrid from "./templates/TileGrid";
import WizardSidebar from "./templates/WizardSidebar";
import Magazine from "./templates/Magazine";
import SlideDeck from "./templates/SlideDeck";

// Keys must match the `id` fields in src/lib/templates/registry.js
export const TEMPLATE_COMPONENTS = {
    stack: Stack,
    fullscreen: FullScreen,
    chat: Chat,
    singlepanel: SinglePanel,
    splitscreen: SplitScreen,
    tilegrid: TileGrid,
    wizard: WizardSidebar,
    magazine: Magazine,
    slidedeck: SlideDeck,
};
