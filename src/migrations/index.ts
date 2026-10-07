import * as migration_20261006_183643_initial from './20261006_183643_initial';
import * as migration_20261006_191933_bot_role_api_key from './20261006_191933_bot_role_api_key';
import * as migration_20261006_232103_glossary_notes from './20261006_232103_glossary_notes';
import * as migration_20261007_013652_case_study from './20261007_013652_case_study';
import * as migration_20261007_131028_expertise_skills from './20261007_131028_expertise_skills';
import * as migration_20261007_141216_profile_availability from './20261007_141216_profile_availability';
import * as migration_20261007_164653_ai_visits from './20261007_164653_ai_visits';
import * as migration_20261007_205245_screen_fields from './20261007_205245_screen_fields';

export const migrations = [
  {
    up: migration_20261006_183643_initial.up,
    down: migration_20261006_183643_initial.down,
    name: '20261006_183643_initial',
  },
  {
    up: migration_20261006_191933_bot_role_api_key.up,
    down: migration_20261006_191933_bot_role_api_key.down,
    name: '20261006_191933_bot_role_api_key',
  },
  {
    up: migration_20261006_232103_glossary_notes.up,
    down: migration_20261006_232103_glossary_notes.down,
    name: '20261006_232103_glossary_notes',
  },
  {
    up: migration_20261007_013652_case_study.up,
    down: migration_20261007_013652_case_study.down,
    name: '20261007_013652_case_study',
  },
  {
    up: migration_20261007_131028_expertise_skills.up,
    down: migration_20261007_131028_expertise_skills.down,
    name: '20261007_131028_expertise_skills',
  },
  {
    up: migration_20261007_141216_profile_availability.up,
    down: migration_20261007_141216_profile_availability.down,
    name: '20261007_141216_profile_availability',
  },
  {
    up: migration_20261007_164653_ai_visits.up,
    down: migration_20261007_164653_ai_visits.down,
    name: '20261007_164653_ai_visits',
  },
  {
    up: migration_20261007_205245_screen_fields.up,
    down: migration_20261007_205245_screen_fields.down,
    name: '20261007_205245_screen_fields'
  },
];
