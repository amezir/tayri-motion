import React, { useCallback, useState } from "react";
import clsx from "clsx";
import styles from "./ControlPanel.module.scss";

const readProfiles = (storageKey) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const writeProfiles = (storageKey, profiles) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(profiles));
  } catch (e) {}
};

const snapshot = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj || {}));
  } catch (e) {
    return {};
  }
};

const DEFAULT_ID = "default";

const ProfilesPanel = ({
  paramsRef,
  updateParam,
  defaults,
  storageKey = "tayri-motion-profiles",
  isAltTheme,
}) => {
  const activeKey = `${storageKey}-active`;
  const [profiles, setProfiles] = useState(() => readProfiles(storageKey));
  const [activeId, setActiveId] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_ID;
    try {
      return window.localStorage.getItem(activeKey) || DEFAULT_ID;
    } catch (e) {
      return DEFAULT_ID;
    }
  });

  const persist = useCallback(
    (next) => {
      setProfiles(next);
      writeProfiles(storageKey, next);
    },
    [storageKey]
  );

  // Mutate every key at once and trigger a single re-render + reprocess so
  // switching a profile updates all settings instantly (one repaint).
  const applyParams = useCallback(
    (params) => {
      if (!params || !paramsRef?.current) return;
      const entries = Object.entries(params);
      if (!entries.length) return;
      entries.forEach(([key, value]) => {
        paramsRef.current[key] = value;
      });
      const [lastKey, lastValue] = entries[entries.length - 1];
      updateParam(lastKey, lastValue);
    },
    [paramsRef, updateParam]
  );

  const rememberActive = useCallback(
    (id) => {
      setActiveId(id);
      try {
        window.localStorage.setItem(activeKey, id);
      } catch (e) {}
    },
    [activeKey]
  );

  const applyProfile = useCallback(
    (profile) => {
      applyParams(profile.id === DEFAULT_ID ? defaults : profile.params);
      rememberActive(profile.id);
    },
    [applyParams, defaults, rememberActive]
  );

  const handleSaveNew = () => {
    if (typeof window === "undefined") return;
    const name = window
      .prompt("Profile name", `Profile ${profiles.length + 1}`)
      ?.trim();
    if (!name) return;
    const id = `profile-${Date.now()}`;
    persist([...profiles, { id, name, params: snapshot(paramsRef?.current) }]);
    rememberActive(id);
  };

  const handleUpdateActive = () => {
    if (activeId === DEFAULT_ID) return;
    persist(
      profiles.map((pr) =>
        pr.id === activeId ? { ...pr, params: snapshot(paramsRef?.current) } : pr
      )
    );
  };

  const handleRename = (profile) => {
    if (typeof window === "undefined") return;
    const name = window.prompt("Rename profile", profile.name)?.trim();
    if (!name) return;
    persist(
      profiles.map((pr) => (pr.id === profile.id ? { ...pr, name } : pr))
    );
  };

  const handleDelete = (profile) => {
    persist(profiles.filter((pr) => pr.id !== profile.id));
    if (activeId === profile.id) {
      applyProfile({ id: DEFAULT_ID });
    }
  };

  const allProfiles = [
    { id: DEFAULT_ID, name: "Default", params: defaults },
    ...profiles,
  ];

  return (
    <div className={styles.profilesSettings}>
      <h4 className={isAltTheme ? styles.altTheme : ""}>Settings Profiles</h4>
      <p
        className={clsx(styles.profilesHint, isAltTheme && styles.profilesHintAlt)}
      >
        Save the current settings as a profile and switch between them anytime.
      </p>

      <div className={styles.profileList}>
        {allProfiles.map((profile) => {
          const isActive = profile.id === activeId;
          const isDefault = profile.id === DEFAULT_ID;
          return (
            <div
              key={profile.id}
              className={clsx(
                styles.profileRow,
                isAltTheme && styles.profileRowAlt,
                isActive && styles.profileRowActive
              )}
            >
              <button
                type="button"
                className={styles.profileName}
                onClick={() => applyProfile(profile)}
                title="Load this profile"
              >
                <span className={styles.profileDot} />
                {profile.name}
                {isDefault && (
                  <span className={styles.profileBadge}>built-in</span>
                )}
              </button>
              {!isDefault && (
                <div className={styles.profileActions}>
                  <button
                    type="button"
                    className={styles.profileIconBtn}
                    onClick={() => handleRename(profile)}
                    title="Rename"
                    aria-label="Rename profile"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={styles.profileIconBtn}
                    onClick={() => handleDelete(profile)}
                    title="Delete"
                    aria-label="Delete profile"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.profileButtons}>
        <button
          type="button"
          className={clsx(
            styles.importButton,
            isAltTheme && styles.importButtonAlt
          )}
          onClick={handleSaveNew}
        >
          Save current as profile
        </button>
        {activeId !== DEFAULT_ID && (
          <button
            type="button"
            className={clsx(
              isAltTheme ? styles.toggleBtnAlt : styles.toggleBtn
            )}
            onClick={handleUpdateActive}
          >
            Update active profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilesPanel;
