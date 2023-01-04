import { PLUGIN_VERSION } from './version';
import { version } from '../package.json';

describe('version', () => {
  it('should contain the current package.json version', () => {
    expect(version).toEqual(PLUGIN_VERSION);
  });
});
