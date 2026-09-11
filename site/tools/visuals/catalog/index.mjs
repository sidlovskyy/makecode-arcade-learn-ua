import { validateCatalog } from '../render-blocks-lib.mjs';
import campaign01 from './campaign-01.mjs';
import campaign02 from './campaign-02.mjs';
import campaign03 from './campaign-03.mjs';
import campaign04 from './campaign-04.mjs';
import campaign05 from './campaign-05.mjs';
import campaign06 from './campaign-06.mjs';

export const blockCatalog = validateCatalog([
  ...campaign01,
  ...campaign02,
  ...campaign03,
  ...campaign04,
  ...campaign05,
  ...campaign06,
]);
