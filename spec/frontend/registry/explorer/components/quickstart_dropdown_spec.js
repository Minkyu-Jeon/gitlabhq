import Vuex from 'vuex';
import { mount, createLocalVue } from '@vue/test-utils';
import { GlDropdown, GlFormGroup, GlFormInputGroup } from '@gitlab/ui';
import * as getters from '~/registry/explorer/stores/getters';
import QuickstartDropdown from '~/registry/explorer/components/quickstart_dropdown.vue';
import ClipboardButton from '~/vue_shared/components/clipboard_button.vue';

import {
  QUICK_START,
  LOGIN_COMMAND_LABEL,
  COPY_LOGIN_TITLE,
  BUILD_COMMAND_LABEL,
  COPY_BUILD_TITLE,
  PUSH_COMMAND_LABEL,
  COPY_PUSH_TITLE,
} from '~/registry/explorer//constants';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('quickstart_dropdown', () => {
  let wrapper;
  let store;

  const findDropdownButton = () => wrapper.find(GlDropdown);
  const findFormGroups = () => wrapper.findAll(GlFormGroup);

  const mountComponent = () => {
    store = new Vuex.Store({
      state: {
        config: {
          repositoryUrl: 'foo',
          registryHostUrlWithPort: 'bar',
        },
      },
      getters,
    });
    wrapper = mount(QuickstartDropdown, {
      localVue,
      store,
    });
  };

  beforeEach(() => {
    mountComponent();
  });

  afterEach(() => {
    wrapper.destroy();
    wrapper = null;
    store = null;
  });

  it('shows the correct text on the button', () => {
    expect(findDropdownButton().text()).toContain(QUICK_START);
  });

  describe.each`
    index | id                    | labelText              | titleText           | getter
    ${0}  | ${'docker-login-btn'} | ${LOGIN_COMMAND_LABEL} | ${COPY_LOGIN_TITLE} | ${'dockerLoginCommand'}
    ${1}  | ${'docker-build-btn'} | ${BUILD_COMMAND_LABEL} | ${COPY_BUILD_TITLE} | ${'dockerBuildCommand'}
    ${2}  | ${'docker-push-btn'}  | ${PUSH_COMMAND_LABEL}  | ${COPY_PUSH_TITLE}  | ${'dockerPushCommand'}
  `('form group at $index', ({ index, id, labelText, titleText, getter }) => {
    let formGroup;

    const findFormInputGroup = parent => parent.find(GlFormInputGroup);
    const findClipboardButton = parent => parent.find(ClipboardButton);

    beforeEach(() => {
      formGroup = findFormGroups().at(index);
    });

    it('exists', () => {
      expect(formGroup.exists()).toBe(true);
    });

    it(`has a label ${labelText}`, () => {
      expect(formGroup.text()).toBe(labelText);
    });

    it(`contains a form input group with ${id} id and with value equal to ${getter} getter`, () => {
      const formInputGroup = findFormInputGroup(formGroup);
      expect(formInputGroup.exists()).toBe(true);
      expect(formInputGroup.attributes('id')).toBe(id);
      expect(formInputGroup.props('value')).toBe(store.getters[getter]);
    });

    it(`contains a clipboard button with title of ${titleText} and text equal to ${getter} getter`, () => {
      const clipBoardButton = findClipboardButton(formGroup);
      expect(clipBoardButton.exists()).toBe(true);
      expect(clipBoardButton.props('title')).toBe(titleText);
      expect(clipBoardButton.props('text')).toBe(store.getters[getter]);
    });
  });
});
