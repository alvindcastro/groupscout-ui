import { SOFT_BASE_CSS } from "./styles/softBaseStyles.js";
import { SOFT_COMPONENT_CSS } from "./styles/softComponentStyles.js";
import { SOFT_LAYOUT_CSS } from "./styles/softLayoutStyles.js";
import { SOFT_MOTION_CSS } from "./styles/softMotionStyles.js";
import { SOFT_TABLE_CSS } from "./styles/softTableStyles.js";

export const SOFT_STYLE_CSS = [
  SOFT_BASE_CSS,
  SOFT_LAYOUT_CSS,
  SOFT_COMPONENT_CSS,
  SOFT_TABLE_CSS,
  SOFT_MOTION_CSS
].join("\n\n");
