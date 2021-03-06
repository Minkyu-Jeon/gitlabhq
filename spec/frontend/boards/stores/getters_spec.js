import getters from '~/boards/stores/getters';
import { inactiveId } from '~/boards/constants';

describe('Boards - Getters', () => {
  describe('getLabelToggleState', () => {
    it('should return "on" when isShowingLabels is true', () => {
      const state = {
        isShowingLabels: true,
      };

      expect(getters.getLabelToggleState(state)).toBe('on');
    });

    it('should return "off" when isShowingLabels is false', () => {
      const state = {
        isShowingLabels: false,
      };

      expect(getters.getLabelToggleState(state)).toBe('off');
    });
  });

  describe('isSidebarOpen', () => {
    it('returns true when activeId is not equal to 0', () => {
      const state = {
        activeId: 1,
      };

      expect(getters.isSidebarOpen(state)).toBe(true);
    });

    it('returns false when activeId is equal to 0', () => {
      const state = {
        activeId: inactiveId,
      };

      expect(getters.isSidebarOpen(state)).toBe(false);
    });
  });

  describe('isSwimlanesOn', () => {
    afterEach(() => {
      window.gon = { features: {} };
    });

    describe('when boardsWithSwimlanes is true', () => {
      beforeEach(() => {
        window.gon = { features: { boardsWithSwimlanes: true } };
      });

      describe('when isShowingEpicsSwimlanes is true', () => {
        it('returns true', () => {
          const state = {
            isShowingEpicsSwimlanes: true,
          };

          expect(getters.isSwimlanesOn(state)).toBe(true);
        });
      });

      describe('when isShowingEpicsSwimlanes is false', () => {
        it('returns false', () => {
          const state = {
            isShowingEpicsSwimlanes: false,
          };

          expect(getters.isSwimlanesOn(state)).toBe(false);
        });
      });
    });

    describe('when boardsWithSwimlanes is false', () => {
      describe('when isShowingEpicsSwimlanes is true', () => {
        it('returns false', () => {
          const state = {
            isShowingEpicsSwimlanes: true,
          };

          expect(getters.isSwimlanesOn(state)).toBe(false);
        });
      });

      describe('when isShowingEpicsSwimlanes is false', () => {
        it('returns false', () => {
          const state = {
            isShowingEpicsSwimlanes: false,
          };

          expect(getters.isSwimlanesOn(state)).toBe(false);
        });
      });
    });
  });
});
