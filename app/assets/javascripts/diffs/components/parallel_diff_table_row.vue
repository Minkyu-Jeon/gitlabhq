<script>
/* eslint-disable vue/no-v-html */
import { mapActions, mapGetters, mapState } from 'vuex';
import $ from 'jquery';
import { GlTooltipDirective } from '@gitlab/ui';
import DiffTableCell from './diff_table_cell.vue';
import {
  MATCH_LINE_TYPE,
  NEW_LINE_TYPE,
  OLD_LINE_TYPE,
  CONTEXT_LINE_TYPE,
  CONTEXT_LINE_CLASS_NAME,
  OLD_NO_NEW_LINE_TYPE,
  PARALLEL_DIFF_VIEW_TYPE,
  NEW_NO_NEW_LINE_TYPE,
  EMPTY_CELL_TYPE,
} from '../constants';

export default {
  components: {
    DiffTableCell,
  },
  directives: {
    GlTooltip: GlTooltipDirective,
  },
  props: {
    fileHash: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    line: {
      type: Object,
      required: true,
    },
    isBottom: {
      type: Boolean,
      required: false,
      default: false,
    },
    isCommented: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      isLeftHover: false,
      isRightHover: false,
    };
  },
  computed: {
    ...mapGetters('diffs', ['fileLineCoverage']),
    ...mapState({
      isHighlighted(state) {
        if (this.isCommented) return true;

        const lineCode =
          (this.line.left && this.line.left.line_code) ||
          (this.line.right && this.line.right.line_code);

        return lineCode ? lineCode === state.diffs.highlightedRow : false;
      },
    }),
    isContextLine() {
      return this.line.left && this.line.left.type === CONTEXT_LINE_TYPE;
    },
    classNameMap() {
      return {
        [CONTEXT_LINE_CLASS_NAME]: this.isContextLine,
        [PARALLEL_DIFF_VIEW_TYPE]: true,
      };
    },
    parallelViewLeftLineType() {
      if (this.line.right && this.line.right.type === NEW_NO_NEW_LINE_TYPE) {
        return OLD_NO_NEW_LINE_TYPE;
      }

      const lineTypeClass = this.line.left ? this.line.left.type : EMPTY_CELL_TYPE;

      return [
        lineTypeClass,
        {
          hll: this.isHighlighted,
        },
      ];
    },
    isMatchLineLeft() {
      return this.line.left && this.line.left.type === MATCH_LINE_TYPE;
    },
    isMatchLineRight() {
      return this.line.right && this.line.right.type === MATCH_LINE_TYPE;
    },
    coverageState() {
      return this.fileLineCoverage(this.filePath, this.line.right.new_line);
    },
  },
  created() {
    this.newLineType = NEW_LINE_TYPE;
    this.oldLineType = OLD_LINE_TYPE;
    this.parallelDiffViewType = PARALLEL_DIFF_VIEW_TYPE;
  },
  mounted() {
    this.scrollToLineIfNeededParallel(this.line);
  },
  methods: {
    ...mapActions('diffs', ['scrollToLineIfNeededParallel']),
    handleMouseMove(e) {
      const isHover = e.type === 'mouseover';
      const hoveringCell = e.target.closest('td');
      const allCellsInHoveringRow = Array.from(e.currentTarget.children);
      const hoverIndex = allCellsInHoveringRow.indexOf(hoveringCell);

      if (hoverIndex >= 3) {
        this.isRightHover = isHover;
      } else {
        this.isLeftHover = isHover;
      }
    },
    // Prevent text selecting on both sides of parallel diff view
    // Backport of the same code from legacy diff notes.
    handleParallelLineMouseDown(e) {
      const line = $(e.currentTarget);
      const table = line.closest('table');

      table.removeClass('left-side-selected right-side-selected');
      const [lineClass] = ['left-side', 'right-side'].filter(name => line.hasClass(name));

      if (lineClass) {
        table.addClass(`${lineClass}-selected`);
      }
    },
  },
};
</script>

<template>
  <tr
    :class="classNameMap"
    class="line_holder"
    @mouseover="handleMouseMove"
    @mouseout="handleMouseMove"
  >
    <template v-if="line.left && !isMatchLineLeft">
      <diff-table-cell
        :file-hash="fileHash"
        :line="line.left"
        :line-type="oldLineType"
        :is-bottom="isBottom"
        :is-hover="isLeftHover"
        :is-highlighted="isHighlighted"
        :show-comment-button="true"
        :diff-view-type="parallelDiffViewType"
        line-position="left"
        class="diff-line-num old_line"
      />
      <td :class="parallelViewLeftLineType" class="line-coverage left-side"></td>
      <td
        :id="line.left.line_code"
        :class="parallelViewLeftLineType"
        class="line_content with-coverage parallel left-side"
        @mousedown="handleParallelLineMouseDown"
        v-html="line.left.rich_text"
      ></td>
    </template>
    <template v-else>
      <td class="diff-line-num old_line empty-cell"></td>
      <td class="line-coverage left-side empty-cell"></td>
      <td class="line_content with-coverage parallel left-side empty-cell"></td>
    </template>
    <template v-if="line.right && !isMatchLineRight">
      <diff-table-cell
        :file-hash="fileHash"
        :line="line.right"
        :line-type="newLineType"
        :is-bottom="isBottom"
        :is-hover="isRightHover"
        :is-highlighted="isHighlighted"
        :show-comment-button="true"
        :diff-view-type="parallelDiffViewType"
        line-position="right"
        class="diff-line-num new_line"
      />
      <td
        v-gl-tooltip.hover
        :title="coverageState.text"
        :class="[line.right.type, coverageState.class, { hll: isHighlighted }]"
        class="line-coverage right-side"
      ></td>
      <td
        :id="line.right.line_code"
        :class="[
          line.right.type,
          {
            hll: isHighlighted,
          },
        ]"
        class="line_content with-coverage parallel right-side"
        @mousedown="handleParallelLineMouseDown"
        v-html="line.right.rich_text"
      ></td>
    </template>
    <template v-else>
      <td class="diff-line-num old_line empty-cell"></td>
      <td class="line-coverage right-side empty-cell"></td>
      <td class="line_content with-coverage parallel right-side empty-cell"></td>
    </template>
  </tr>
</template>
