export const FILE_VERSION = '0.1';

export function isNewerVersion(current: string, target: string) {
    const currentVersion = versionParser(current);
    const targetVersion = versionParser(target);

    if (currentVersion.major < targetVersion.major) return false;
    if (currentVersion.major > targetVersion.major) return true;

    if (currentVersion.minor < targetVersion.minor) return false;
    if (currentVersion.minor > targetVersion.minor) return true;

    if (currentVersion.patch < targetVersion.patch) return false;
    if (currentVersion.patch > targetVersion.patch) return true;

    return false;
}

function versionParser(version: string) {
    const [major, minor, patch] = version.split('.').map(v => {
        const parsed = parseInt(v);
        if (isNaN(parsed)) return 0;
        return parsed;
    });
    return {
        major: isNaN(major) ? 0 : major,
        minor: isNaN(minor) ? 0 : minor,
        patch: isNaN(patch) ? 0 : patch
    }
}