import { shallowMount } from '@vue/test-utils';
import { mockIntegrationProps } from 'jest/integrations/edit/mock_data';
import { createStore } from '~/integrations/edit/store';
import IntegrationForm from '~/integrations/edit/components/integration_form.vue';
import OverrideDropdown from '~/integrations/edit/components/override_dropdown.vue';
import ActiveCheckbox from '~/integrations/edit/components/active_checkbox.vue';
import JiraTriggerFields from '~/integrations/edit/components/jira_trigger_fields.vue';
import JiraIssuesFields from '~/integrations/edit/components/jira_issues_fields.vue';
import TriggerFields from '~/integrations/edit/components/trigger_fields.vue';
import DynamicField from '~/integrations/edit/components/dynamic_field.vue';

describe('IntegrationForm', () => {
  let wrapper;

  const createComponent = (customStateProps = {}, featureFlags = {}, initialState = {}) => {
    wrapper = shallowMount(IntegrationForm, {
      propsData: {},
      store: createStore({
        customState: { ...mockIntegrationProps, ...customStateProps },
        ...initialState,
      }),
      stubs: {
        OverrideDropdown,
        ActiveCheckbox,
        JiraTriggerFields,
        TriggerFields,
      },
      provide: {
        glFeatures: featureFlags,
      },
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
      wrapper = null;
    }
  });

  const findOverrideDropdown = () => wrapper.find(OverrideDropdown);
  const findActiveCheckbox = () => wrapper.find(ActiveCheckbox);
  const findJiraTriggerFields = () => wrapper.find(JiraTriggerFields);
  const findJiraIssuesFields = () => wrapper.find(JiraIssuesFields);
  const findTriggerFields = () => wrapper.find(TriggerFields);

  describe('template', () => {
    describe('showActive is true', () => {
      it('renders ActiveCheckbox', () => {
        createComponent();

        expect(findActiveCheckbox().exists()).toBe(true);
      });
    });

    describe('showActive is false', () => {
      it('does not render ActiveCheckbox', () => {
        createComponent({
          showActive: false,
        });

        expect(findActiveCheckbox().exists()).toBe(false);
      });
    });

    describe('type is "slack"', () => {
      beforeEach(() => {
        createComponent({ type: 'slack' });
      });

      it('does not render JiraTriggerFields', () => {
        expect(findJiraTriggerFields().exists()).toBe(false);
      });

      it('does not render JiraIssuesFields', () => {
        expect(findJiraIssuesFields().exists()).toBe(false);
      });
    });

    describe('type is "jira"', () => {
      it('renders JiraTriggerFields', () => {
        createComponent({ type: 'jira' });

        expect(findJiraTriggerFields().exists()).toBe(true);
      });

      describe('featureFlag jiraIssuesIntegration is false', () => {
        it('does not render JiraIssuesFields', () => {
          createComponent({ type: 'jira' }, { jiraIssuesIntegration: false });

          expect(findJiraIssuesFields().exists()).toBe(false);
        });
      });

      describe('featureFlag jiraIssuesIntegration is true', () => {
        it('renders JiraIssuesFields', () => {
          createComponent({ type: 'jira' }, { jiraIssuesIntegration: true });

          expect(findJiraIssuesFields().exists()).toBe(true);
        });
      });
    });

    describe('triggerEvents is present', () => {
      it('renders TriggerFields', () => {
        const events = [{ title: 'push' }];
        const type = 'slack';

        createComponent({
          triggerEvents: events,
          type,
        });

        expect(findTriggerFields().exists()).toBe(true);
        expect(findTriggerFields().props('events')).toBe(events);
        expect(findTriggerFields().props('type')).toBe(type);
      });
    });

    describe('fields is present', () => {
      it('renders DynamicField for each field', () => {
        const fields = [
          { name: 'username', type: 'text' },
          { name: 'API token', type: 'password' },
        ];

        createComponent({
          fields,
        });

        const dynamicFields = wrapper.findAll(DynamicField);

        expect(dynamicFields).toHaveLength(2);
        dynamicFields.wrappers.forEach((field, index) => {
          expect(field.props()).toMatchObject(fields[index]);
        });
      });
    });

    describe('adminState state is null', () => {
      it('does not render OverrideDropdown', () => {
        createComponent(
          {},
          {},
          {
            adminState: null,
          },
        );

        expect(findOverrideDropdown().exists()).toBe(false);
      });
    });

    describe('adminState state is an object', () => {
      it('renders OverrideDropdown', () => {
        createComponent(
          {},
          {},
          {
            adminState: {
              ...mockIntegrationProps,
            },
          },
        );

        expect(findOverrideDropdown().exists()).toBe(true);
      });
    });
  });
});
