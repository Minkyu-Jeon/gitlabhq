<script>
import { mapState } from 'vuex';
import { GlIcon } from '@gitlab/ui';
import { __, sprintf } from '~/locale';
import tooltip from '~/vue_shared/directives/tooltip';
import eventHub from '~/sidebar/event_hub';
import EditForm from './edit_form.vue';

export default {
  components: {
    EditForm,
    GlIcon,
  },
  directives: {
    tooltip,
  },
  props: {
    fullPath: {
      required: true,
      type: String,
    },
    isEditable: {
      required: true,
      type: Boolean,
    },
    issuableType: {
      required: false,
      type: String,
      default: 'issue',
    },
  },
  data() {
    return {
      edit: false,
    };
  },
  computed: {
    ...mapState({
      confidential: ({ noteableData, confidential }) => {
        if (noteableData) {
          return noteableData.confidential;
        }
        return Boolean(confidential);
      },
    }),
    confidentialityIcon() {
      return this.confidential ? 'eye-slash' : 'eye';
    },
    tooltipLabel() {
      return this.confidential ? __('Confidential') : __('Not confidential');
    },
    confidentialText() {
      return sprintf(__('This %{issuableType} is confidential'), {
        issuableType: this.issuableType,
      });
    },
  },
  created() {
    eventHub.$on('closeConfidentialityForm', this.toggleForm);
  },
  beforeDestroy() {
    eventHub.$off('closeConfidentialityForm', this.toggleForm);
  },
  methods: {
    toggleForm() {
      this.edit = !this.edit;
    },
  },
};
</script>

<template>
  <div class="block issuable-sidebar-item confidentiality">
    <div
      ref="collapseIcon"
      v-tooltip
      :title="tooltipLabel"
      class="sidebar-collapsed-icon"
      data-container="body"
      data-placement="left"
      data-boundary="viewport"
      @click="toggleForm"
    >
      <gl-icon :name="confidentialityIcon" aria-hidden="true" />
    </div>
    <div class="title hide-collapsed">
      {{ __('Confidentiality') }}
      <a
        v-if="isEditable"
        ref="editLink"
        class="float-right confidential-edit"
        href="#"
        data-track-event="click_edit_button"
        data-track-label="right_sidebar"
        data-track-property="confidentiality"
        @click.prevent="toggleForm"
        >{{ __('Edit') }}</a
      >
    </div>
    <div class="value sidebar-item-value hide-collapsed">
      <edit-form
        v-if="edit"
        :confidential="confidential"
        :full-path="fullPath"
        :issuable-type="issuableType"
      />
      <div v-if="!confidential" class="no-value sidebar-item-value" data-testid="not-confidential">
        <gl-icon :size="16" name="eye" aria-hidden="true" class="sidebar-item-icon inline" />
        {{ __('Not confidential') }}
      </div>
      <div v-else class="value sidebar-item-value hide-collapsed">
        <gl-icon
          :size="16"
          name="eye-slash"
          aria-hidden="true"
          class="sidebar-item-icon inline is-active"
        />
        {{ confidentialText }}
      </div>
    </div>
  </div>
</template>
