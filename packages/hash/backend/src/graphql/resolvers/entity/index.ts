import { properties } from "./properties";
import { history } from "./history";
import { links } from "./links";
import { linkedEntities } from "./linkedEntities";
import { linkedAggregations } from "./linkedAggregations";

export const entityFields = {
  properties,
  history,
  links,
  linkedEntities,
  linkedAggregations,
};

export { aggregateEntity } from "./aggregateEntity";
export { createEntity } from "./createEntity";
export { entity } from "./entity";
export { updateEntity } from "./updateEntity";
