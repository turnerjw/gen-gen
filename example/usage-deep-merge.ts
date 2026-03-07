import {generateUserFixture} from "./data-gen-deep-merge";

const user = generateUserFixture(({generateProfile}) => ({
  profile: generateProfile(({generateSettings}) => ({
    settings: generateSettings({
      theme: "dark",
    }),
  })),
}));

// In deep-merge mode, profile.name and profile.settings.locale are preserved.
console.log(user.profile.name, user.profile.settings.locale, user.profile.settings.theme);
