import { beforeEach, describe } from 'vitest';

import { dictionaryTest } from '../../lib/dictionaries/_dictionaries.test.mjs';
import { mappTest } from '../../lib/mapp.test.mjs';
import { alert } from '../../lib/ui/elements/alert.test.mjs';
import { confirm } from '../../lib/ui/elements/confirm.test.mjs';
import { dialog } from '../../lib/ui/elements/dialog.test.mjs';
import { dropdown } from '../../lib/ui/elements/dropdown.test.mjs';
import { pills } from '../../lib/ui/elements/pills.test.mjs';
import { toast } from '../../lib/ui/elements/toast.test.mjs';
import { compose } from '../../lib/utils/compose.test.mjs';
import { gazetteer } from '../../lib/utils/gazetteer.test.mjs';
import { jsonParser } from '../../lib/utils/jsonParser.test.mjs';
import { keyvalue_dictionary } from '../../lib/utils/keyvalue_dictionary.test.mjs';
import { merge } from '../../lib/utils/merge.test.mjs';
import { numericFormatter } from '../../lib/utils/numericFormatter.test.mjs';
import { paramString } from '../../lib/utils/paramString.test.mjs';
import { temporal } from '../../lib/utils/temporal.test.mjs';
import { versionCheck } from '../../lib/utils/versionCheck.mjs';

describe('browser suites migrated to Vitest Browser Mode', () => {
  beforeEach(() => {
    globalThis.__resetBrowserTestState?.();
  });

  describe('core', () => {
    mappTest.base();
  });

  describe('dictionaries', () => {
    dictionaryTest.baseDictionaryTest();
    dictionaryTest.unknownLanguageTest();
  });

  describe('utils', () => {
    compose();
    gazetteer();
    jsonParser();
    keyvalue_dictionary();
    merge();
    numericFormatter();
    paramString();
    temporal();
    versionCheck();
  });

  describe('ui elements', () => {
    alert();
    confirm();
    dialog();
    dropdown();
    pills();
    toast();
  });
});
