/*
 * wysiwyg web editor
 *
 * suneditor.js
 * Copyright 2017 JiHong Lee.
 * MIT license.
 */
'use strict';

export default {
    name: 'table',
    add: function (core, targetElement) {
        const context = core.context;
        context.table = {
            _element: null,
            _tdElement: null,
            _trElement: null,
            _trElements: null,
            _tableXY: [],
            _maxWidth: true,
            resizeIcon: null,
            resizeText: null,
            headerButton: null,
            mergeButton: null,
            splitButton: null,
            splitMenu: null,
            maxText: core.lang.controller.maxSize,
            minText: core.lang.controller.minSize,
            _physical_cellCnt: 0,
            _logical_cellCnt: 0,
            _physical_rowCnt: 0,
            _logical_rowCnt: 0,
            _rowIndex: 0,
            _physical_cellIndex: 0,
            _logical_cellIndex: 0,
            _current_colSpan: 0,
            _current_rowSpan: 0
        };

        /** set submenu */
        let listDiv = eval(this.setSubmenu.call(core));
        let tablePicker = listDiv.querySelector('.se-controller-table-picker');

        context.table.tableHighlight = listDiv.querySelector('.se-table-size-highlighted');
        context.table.tableUnHighlight = listDiv.querySelector('.se-table-size-unhighlighted');
        context.table.tableDisplay = listDiv.querySelector('.se-table-size-display');

        /** set table controller */
        let tableController = eval(this.setController_table.call(core));
        context.table.tableController = tableController;
        context.table.resizeIcon = tableController.querySelector('_se_table_resize > i');
        context.table.resizeText = tableController.querySelector('_se_table_resize > span > span');
        context.table.headerButton = tableController.querySelector('.__se__table_header');
        tableController.addEventListener('mousedown', function (e) { e.stopPropagation(); }, false);

        /** set resizing */
        let resizeDiv = eval(this.setController_tableEditor.call(core));
        context.table.resizeDiv = resizeDiv;
        context.table.splitMenu = resizeDiv.querySelector('._se_table_split_menu');
        context.table.mergeButton = resizeDiv.querySelector('._se_table_merge_button');
        context.table.splitButton = resizeDiv.querySelector('._se_table_split_button');
        resizeDiv.addEventListener('mousedown', function (e) { e.stopPropagation(); }, false);
        
        /** add event listeners */
        tablePicker.addEventListener('mousemove', this.onMouseMove_tablePicker.bind(core));
        tablePicker.addEventListener('click', this.appendTable.bind(core));
        resizeDiv.addEventListener('click', this.onClick_tableController.bind(core));
        tableController.addEventListener('click', this.onClick_tableController.bind(core));

        /** append html */
        targetElement.parentNode.appendChild(listDiv);
        context.element.relative.appendChild(resizeDiv);
        context.element.relative.appendChild(tableController);

        /** empty memory */
        listDiv = null, tablePicker = null, resizeDiv = null, tableController = null;
    },

    setSubmenu: function () {
        const listDiv = this.util.createElement('DIV');
        listDiv.className = 'se-submenu se-selector-table';
        listDiv.style.display = 'none';

        listDiv.innerHTML = '' +
            '<div class="se-table-size">' +
            '   <div class="se-table-size-picker se-controller-table-picker"></div>' +
            '   <div class="se-table-size-highlighted"></div>' +
            '   <div class="se-table-size-unhighlighted"></div>' +
            '</div>' +
            '<div class="se-table-size-display">1 x 1</div>';

        return listDiv;
    },

    setController_table: function () {
        const lang = this.lang;
        const tableResize = this.util.createElement('DIV');

        tableResize.className = 'se-controller se-controller-table';
        tableResize.style.display = 'none';
        tableResize.innerHTML = '' +
            '<div>' +
            '   <div class="se-btn-group">' +
            '       <button type="button" data-command="resize" class="se-tooltip _se_table_resize">' +
            '           <i class="se-icon-expansion"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.maxSize + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="header" class="se-tooltip se-btn-basic __se__table_header">' +
            '           <i class="se-icon-table-header"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.tableHeader + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="remove" class="se-tooltip">' +
            '           <i class="se-icon-delete"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.remove + '</span></span>' +
            '       </button>' +
            '   </div>' +
            '</div>';

        return tableResize;
    },

    setController_tableEditor: function () {
        const lang = this.lang;
        const tableResize = this.util.createElement('DIV');

        tableResize.className = 'se-controller se-controller-table-cell';
        tableResize.style.display = 'none';
        tableResize.innerHTML = '' +
            '<div class="se-arrow se-arrow-up"></div>' +
            '<div>' +
            '   <div class="se-btn-group">' +
            '       <button type="button" data-command="insert" data-value="row" data-option="up" class="se-tooltip">' +
            '           <i class="se-icon-insert-row-above"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.insertRowAbove + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="insert" data-value="row" data-option="down" class="se-tooltip">' +
            '           <i class="se-icon-insert-row-below"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.insertRowBelow + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="delete" data-value="row" class="se-tooltip">' +
            '           <i class="se-icon-delete-row"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.deleteRow + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="merge" class="_se_table_merge_button se-tooltip" disabled>' +
            '           <i class="se-icon-merge-cell"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.mergeCells + '</span></span>' +
            '       </button>' +
            '   </div>' +
            '</div>' +
            '<div>' +
            '   <div class="se-btn-group">' +
            '     <button type="button" data-command="insert" data-value="cell" data-option="left" class="se-tooltip">' +
            '       <i class="se-icon-insert-column-left"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.insertColumnBefore + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="insert" data-value="cell" data-option="right" class="se-tooltip">' +
            '           <i class="se-icon-insert-column-right"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.insertColumnAfter + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="delete" data-value="cell" class="se-tooltip">' +
            '           <i class="se-icon-delete-column"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.deleteColumn + '</span></span>' +
            '       </button>' +
            '       <button type="button" data-command="onsplit" class="_se_table_split_button se-tooltip">' +
            '           <i class="se-icon-split-cell"></i>' +
            '           <span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.splitCells + '</span></span>' +
            '       </button>' +
            '       <div class="_se_table_split_menu sun-editor-common se-list-layer" style="display:none; left:50%;">' +
            '           <div class="se-list-inner">' +
            '               <ul class="se-list-basic">' +
            '                   <li class="se-btn-list" data-command="split" data-value="vertical" style="line-height:32px;" title="' + lang.controller.VerticalSplit + '">' + 
            '                   ' + lang.controller.VerticalSplit + '</li>' +
            '                   <li class="se-btn-list" data-command="split" data-value="horizontal" style="line-height:32px;" title="' + lang.controller.HorizontalSplit + '">' + 
            '                   ' + lang.controller.HorizontalSplit + '</li>' +
            '               </ul>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</div>';

        return tableResize;
    },

    appendTable: function () {
        const oTable = this.util.createElement('TABLE');

        let x = this.context.table._tableXY[0];
        let y = this.context.table._tableXY[1];
        let tableHTML = '<tbody>';

        while (y > 0) {
            tableHTML += '<tr>';
            let tdCnt = x;
            while (tdCnt > 0) {
                tableHTML += '<td><div>' + this.util.zeroWidthSpace + '</div></td>';
                --tdCnt;
            }
            tableHTML += '</tr>';
            --y;
        }
        tableHTML += '</tbody>';

        oTable.innerHTML = tableHTML;

        this.insertComponent(oTable);
        
        this.focus();
        this.plugins.table.reset_table_picker.call(this);
    },

    onMouseMove_tablePicker: function (e) {
        e.stopPropagation();

        let x = this._w.Math.ceil(e.offsetX / 18);
        let y = this._w.Math.ceil(e.offsetY / 18);
        x = x < 1 ? 1 : x;
        y = y < 1 ? 1 : y;
        this.context.table.tableHighlight.style.width = x + 'em';
        this.context.table.tableHighlight.style.height = y + 'em';

        let x_u = x < 5 ? 5 : (x > 9 ? 10 : x + 1);
        let y_u = y < 5 ? 5 : (y > 9 ? 10 : y + 1);
        this.context.table.tableUnHighlight.style.width = x_u + 'em';
        this.context.table.tableUnHighlight.style.height = y_u + 'em';

        this.util.changeTxt(this.context.table.tableDisplay, x + ' x ' + y);
        this.context.table._tableXY = [x, y];
    },

    reset_table_picker: function () {
        if (!this.context.table.tableHighlight) return;

        const highlight = this.context.table.tableHighlight.style;
        const unHighlight = this.context.table.tableUnHighlight.style;

        highlight.width = '1em';
        highlight.height = '1em';
        unHighlight.width = '5em';
        unHighlight.height = '5em';

        this.util.changeTxt(this.context.table.tableDisplay, '1 x 1');
        this.submenuOff();
    },

    init: function () {
        const contextTable = this.context.table;
        const tablePlugin = this.plugins.table;

        if (!contextTable._element) return;

        const selectedCells = contextTable._element.querySelectorAll('.se-table-selected-cell');
        for (let i = 0, len = selectedCells.length; i < len; i++) {
            this.util.removeClass(selectedCells[i], 'se-table-selected-cell');
        }

        contextTable._element = null;
        contextTable._tdElement = null;
        contextTable._trElement = null;
        contextTable._trElements = null;
        contextTable._tableXY = [];
        contextTable._maxWidth = true;
        contextTable._physical_cellCnt = 0;
        contextTable._logical_cellCnt = 0;
        contextTable._physical_rowCnt = 0;
        contextTable._logical_rowCnt = 0;
        contextTable._rowIndex = 0;
        contextTable._physical_cellIndex = 0;
        contextTable._logical_cellIndex = 0;
        contextTable._current_colSpan = 0;
        contextTable._current_rowSpan = 0;

        tablePlugin._selectedCells = null;
        tablePlugin._selectedTable = null;
        tablePlugin._ref = null;
    },

    /** table edit controller */
    call_controller_tableEdit: function (tdElement) {
        const contextTable = this.context.table;
        const tableController = contextTable.tableController;
        
        this.plugins.table.setPositionControllerDiv.call(this, tdElement, false);

        const tableElement = contextTable._element;
        const offset = this.util.getOffset(tableElement);

        contextTable._maxWidth = !tableElement.style.width || tableElement.style.width === '100%';
        this.plugins.table.resizeTable.call(this);
        tableController.style.left = (offset.left + tableElement.offsetLeft - this.context.element.wysiwyg.scrollLeft) + 'px';
        tableController.style.display = 'block';
        tableController.style.top = (offset.top + tableElement.offsetTop - tableController.offsetHeight - 2) + 'px';

        this.controllersOn(contextTable.resizeDiv, tableController, this.plugins.table.init.bind(this));
    },

    setPositionControllerDiv: function (tdElement, reset) {
        const contextTable = this.context.table;
        const resizeDiv = contextTable.resizeDiv;
        
        this.plugins.table.setCellInfo.call(this, tdElement, reset);

        resizeDiv.style.display = 'block';

        const offset = this.util.getOffset(tdElement);
        resizeDiv.style.left = (offset.left - this.context.element.wysiwyg.scrollLeft) + 'px';
        resizeDiv.style.top = (offset.top + tdElement.offsetHeight + 12) + 'px';

        const overLeft = this.context.element.wysiwyg.offsetWidth - (resizeDiv.offsetLeft + resizeDiv.offsetWidth);
        if (overLeft < 0) {
            resizeDiv.style.left = (resizeDiv.offsetLeft + overLeft) + 'px';
            resizeDiv.firstElementChild.style.left = (20 - overLeft) + 'px';
        } else {
            resizeDiv.firstElementChild.style.left = '20px';
        }
    },

    setCellInfo: function (tdElement, reset) {
        const contextTable = this.context.table;
        const table = contextTable._element = this.plugins.table._selectedTable || this.util.getParentElement(tdElement, 'TABLE');

        if (/THEAD/i.test(table.firstElementChild.nodeName)) {
            this.util.addClass(contextTable.headerButton, 'on');
        } else {
            this.util.removeClass(contextTable.headerButton, 'on');
        }

        if (reset || contextTable._physical_cellCnt === 0) {
            if (contextTable._tdElement !== tdElement) {
                contextTable._tdElement = tdElement;
                contextTable._trElement = tdElement.parentNode;
            }

            const rows = contextTable._trElements = table.rows;
            const cellIndex = tdElement.cellIndex;
            let logcalCellIndex = 0;

            // row index
            const rowIndex = contextTable._rowIndex = contextTable._trElement.rowIndex;

            // count
            let cellCnt = 0;
            let rowCnt = 0;
            
            for (let i = 0, cells = rows[0].cells, len = rows[0].cells.length; i < len; i++) {
                cellCnt += cells[i].colSpan;
            }

            for (let i = 0, len = rows.length; i < len; i++) {
                if (rows[i].cells.length === 0) continue;
                rowCnt += rows[i].cells[0].rowSpan;

                if (i === rowIndex) {
                    const cells = rows[i].cells;
                    let index = cellIndex;
                    for (let c = 0; c < index; c++) {
                        logcalCellIndex += cells[c].colSpan;
                    }
                }
            }

            contextTable._physical_cellCnt = contextTable._trElement.cells.length;
            contextTable._logical_cellCnt = cellCnt;
            contextTable._physical_rowCnt = contextTable._trElements.length;
            contextTable._logical_rowCnt = rowCnt;

            // cell index
            let colSpan = 0;

            for (let i = 0, cells, cIndex; i <= rowIndex; i++) {
                cells = rows[i].cells;
                if (cells.length === 0) continue;
                cIndex = logcalCellIndex;
                for (let c = 0, cell, rs, cs; c <= cIndex; c++) {
                    cell = cells[c];
                    if (!cell) break;

                    rs = cell.rowSpan;
                    cs = cell.colSpan;
                    cIndex -= cs - 1;
                    if (rs < 2 && cs < 2) continue;

                    if (i === rowIndex) {
                        if (cs > 1 && c < cellIndex) colSpan += cs - 1;
                        continue;
                    }

                    if (rs + i > rowIndex && rowIndex > i) {
                        colSpan += cs;
                    }
                }
            }

            contextTable._physical_cellIndex = cellIndex;
            contextTable._logical_cellIndex = cellIndex + colSpan;

            // span
            contextTable._current_colSpan = contextTable._tdElement.colSpan - 1;
            contextTable._current_rowSpan - contextTable._trElement.cells[cellIndex].rowSpan - 1;
        }
    },

    editTable: function (type, option) {
        const tablePlugin = this.plugins.table;
        const contextTable = this.context.table;
        const table = contextTable._element;
        const isRow = type === 'row';

        if (isRow) {
            const tableAttr = contextTable._trElement.parentNode;
            if (/^THEAD$/i.test(tableAttr.nodeName)) {
                if (option === 'up') {
                    return;
                } else if (!tableAttr.nextElementSibling || !/^TBODY$/i.test(tableAttr.nextElementSibling.nodeName)) {
                    const tbody = this.util.createElement('TBODY');
                    const tr = this.util.createElement('TR');
                    tbody.appendChild(tr);

                    for (let i = 0, len = contextTable._logical_cellCnt; i < len; i++) {
                        tr.innerHTML += '<td><div>' + this.util.zeroWidthSpace + '</div></td>';
                    }

                    table.appendChild(tbody);
                    return;
                }
            }
        }

        // multi cells
        if (tablePlugin._ref) {
            const positionCell = contextTable._tdElement;
            const selectedCells = tablePlugin._selectedCells;

            if (isRow) {
                if (!option) {
                    let row = selectedCells[0].parentNode;
                    const removeCells = [selectedCells[0]];

                    for (let i = 1, len = selectedCells.length, cell; i < len; i++) {
                        cell = selectedCells[i];
                        if (row !== cell.parentNode) {
                            removeCells.push(cell);
                            row = cell.parentNode;
                        }
                    }

                    for (let i = 0, len = removeCells.length; i < len; i++) {
                        tablePlugin.setCellInfo.call(this, removeCells[i], true);
                        tablePlugin.editRow.call(this, option);
                    }
                } else {
                    tablePlugin.setCellInfo.call(this, option === 'up' ? selectedCells[0] : selectedCells[selectedCells.length - 1], true);
                    tablePlugin.editRow.call(this, option, positionCell);
                }
            } else {
                const firstRow = selectedCells[0].parentNode;
                if (!option) {
                    const removeCells = [selectedCells[0]];
                    
                    for (let i = 1, len = selectedCells.length - 1, cell; i < len; i++) {
                        cell = selectedCells[i];
                        if (firstRow === cell.parentNode) {
                            removeCells.push(cell);
                        } else {
                            break;
                        }
                    }

                    for (let i = 0, len = removeCells.length; i < len; i++) {
                        tablePlugin.setCellInfo.call(this, removeCells[i], true);
                        tablePlugin.editCell.call(this, option);
                    }
                } else {
                    let rightCell = null;

                    for (let i = 0, len = selectedCells.length - 1; i < len; i++) {
                        if (firstRow !== selectedCells[i + 1].parentNode) {
                            rightCell = selectedCells[i];
                            break;
                        }
                    }

                    tablePlugin.setCellInfo.call(this, option === 'left' ? selectedCells[0] : rightCell || selectedCells[0], true);
                    tablePlugin.editCell.call(this, option, positionCell);
                }
            }

            if (!option) tablePlugin.init.call(this);
        } // one cell
        else {
            tablePlugin[isRow ? 'editRow' : 'editCell'].call(this, option);
        }

        if (!option) {
            const children = table.children;
            for (let i = 0; i < children.length; i++) {
                if (children[i].children.length === 0) {
                    this.util.removeItem(children[i]);
                    i--;
                }
            }

            if (table.children.length === 0) this.util.removeItem(table);
        }
    },

    editRow: function (option, positionResetElement) {
        const contextTable = this.context.table;
        const remove = !option;

        const up = option === 'up';
        const originRowIndex = contextTable._rowIndex;
        const rowIndex = remove || up ? originRowIndex : originRowIndex + contextTable._current_rowSpan + 1;
        const sign = remove ? -1 : 1;
        
        const rows = contextTable._trElements;
        let cellCnt = contextTable._logical_cellCnt;

        for (let i = 0, len = originRowIndex + (remove ? -1 : 0), cell; i <= len; i++) {
            cell = rows[i].cells;
            if (cell.length === 0) return;
            
            for (let c = 0, cLen = cell.length, rs, cs; c < cLen; c++) {
                rs = cell[c].rowSpan;
                cs = cell[c].colSpan;
                if (rs < 2 && cs < 2) continue;

                if (rs + i > rowIndex && rowIndex > i) {
                    cell[c].rowSpan = rs + sign;
                    cellCnt -= cs;
                }
            }
        }

        if (remove) {
            const next = rows[originRowIndex + 1];
            if (next) {
                const spanCells = [];
                let cells = rows[originRowIndex].cells;
                let colSpan = 0;

                for (let i = 0, len = cells.length, cell, logcalIndex; i < len; i++) {
                    cell = cells[i];
                    logcalIndex = i + colSpan;
                    colSpan += cell.colSpan - 1;

                    if (cell.rowSpan > 1) {
                        cell.rowSpan -= 1;
                        spanCells.push({cell: cell.cloneNode(false), index: logcalIndex});
                    }
                }

                if (spanCells.length > 0) {
                    let spanCell = spanCells.shift();
                    cells = next.cells;
                    colSpan = 0;

                    for (let i = 0, len = cells.length, cell, logcalIndex; i < len; i++) {
                        cell = cells[i];
                        logcalIndex = i + colSpan;
                        colSpan += cell.colSpan - 1;
    
                        if (logcalIndex >= spanCell.index) {
                            i--, colSpan--;
                            colSpan += spanCell.cell.colSpan - 1;
                            next.insertBefore(spanCell.cell, cell);
                            spanCell = spanCells.shift();
                            if (!spanCell) break;
                        }
                    }

                    if (spanCell) {
                        next.appendChild(spanCell.cell);
                        for (let i = 0, len = spanCells.length; i < len; i++) {
                            next.appendChild(spanCells[i].cell);
                        }
                    }
                }
            }

            contextTable._element.deleteRow(rowIndex);
        } else {
            let cells = '';

            for (let i = 0, len = cellCnt; i < len; i++) {
                cells += '<td><div>' + this.util.zeroWidthSpace + '</div></td>';
            }

            const newRow = contextTable._element.insertRow(rowIndex);
            newRow.innerHTML = cells;
        }

        if (!remove) {
            this.plugins.table.setPositionControllerDiv.call(this, positionResetElement || contextTable._tdElement, true);
        } else {
            this.controllersOff();
        }
    },

    editCell: function (option, positionResetElement) {
        const contextTable = this.context.table;
        const remove = !option;

        const left = option === 'left';
        const colSpan = contextTable._current_colSpan;
        const cellIndex = remove || left ? contextTable._logical_cellIndex : contextTable._logical_cellIndex + colSpan + 1;

        const rows = contextTable._trElements;
        let rowSpanArr = [];
        let spanIndex = [];
        let passCell = 0;
        const removeCell = [];
        const removeSpanArr = [];

        for (let i = 0, len = rows.length, row, insertIndex, cells, newCell, applySpan, cellColSpan; i < len; i++) {
            row = rows[i];
            insertIndex = cellIndex;
            applySpan = false;
            cells = row.cells;
            cellColSpan = 0;

            for (let c = 0, cell, cLen = cells.length, rs, cs, removeIndex; c < cLen; c++) {
                cell = cells[c];
                if (!cell) break;

                rs = cell.rowSpan - 1;
                cs = cell.colSpan - 1;

                if (remove ? c > insertIndex + colSpan : c >= insertIndex) {
                    if (!remove) break;

                    if (rs > 0) {
                        removeSpanArr.push({
                            cell: cell,
                            i: i,
                            rs: i + rs
                        });
                    }

                    continue;
                }

                if (!remove) {
                    if (cs > 0) {
                        if (passCell < 1 && cs + c >= insertIndex) {
                            cell.colSpan += 1;
                            insertIndex = null;
                            passCell = rs + 1;
                            break;
                        }

                        insertIndex -= cs;
                    }

                    if (!applySpan) {
                        for (let r = 0, arr; r < spanIndex.length; r++) {
                            arr = spanIndex[r];
                            insertIndex -= arr.cs;
                            arr.rs -= 1;
                            if (arr.rs < 1) {
                                spanIndex.splice(r, 1);
                                r--;
                            }  
                        }
                        applySpan = true;
                    }
                } else {
                    removeIndex = c + cellColSpan;

                    if (spanIndex.length > 0) {
                        const lastCell = !cells[c + 1];
                        for (let r = 0, arr; r < spanIndex.length; r++) {
                            arr = spanIndex[r];
                            if (arr.row > i) continue;

                            if (removeIndex >= arr.index) {
                                cellColSpan += arr.cs;
                                removeIndex = c + cellColSpan;
                                arr.rs -= 1;
                                arr.row = i + 1;
                                if (arr.rs < 1) {
                                    spanIndex.splice(r, 1);
                                    r--;
                                }  
                            } else if (lastCell) {
                                arr.rs -= 1;
                                arr.row = i + 1;
                                if (arr.rs < 1) {
                                    spanIndex.splice(r, 1);
                                }
                            }
                        }
                    }

                    if (rs > 0) {
                        rowSpanArr.push({
                            rs: rs,
                            cs: cs + 1,
                            index: removeIndex,
                            row: -1
                        });
                    }

                    if (removeIndex >= insertIndex && removeIndex + cs <= insertIndex + colSpan) {
                        removeCell.push(cell);
                    } else if (removeIndex <= insertIndex + colSpan && removeIndex + cs >= insertIndex) {
                        let modifyColSpan = 0;

                        for (let m = cellIndex; m <= cellIndex + colSpan; m++) {
                            if (m >= removeIndex && m <= removeIndex + cs) {
                                modifyColSpan++;
                            }
                        }

                        cell.colSpan -= this._w.Math.abs(modifyColSpan);
                    }

                    cellColSpan += cs;
                }
            }

            spanIndex = spanIndex.concat(rowSpanArr).sort(function (a, b) {return a.index - b.index;});

            rowSpanArr = [];

            if (!remove) {
                if (passCell > 0) {
                    passCell -= 1;
                    continue;
                }

                if (insertIndex !== null && cells.length > 0) {
                    newCell = this.util.createElement(cells[0].nodeName);
                    newCell.innerHTML = '<div>' + this.util.zeroWidthSpace + '</div>';
                    newCell = row.insertBefore(newCell, cells[insertIndex]);
                }
            }
        }

        if (remove) {
            const removeRowArr = [];
            for (let r = 0, rLen = removeCell.length, row; r < rLen; r++) {
                row = removeCell[r].parentNode;
                this.util.removeItem(removeCell[r]);
                if (row.cells.length === 0) {
                    removeRowArr.push({
                        i: this.util.getArrayIndex(rows, row)
                    });

                    this.util.removeItem(row);
                }
            }

            for (let i = 0, len = removeRowArr.length, row; i < len; i++) {
                row = removeRowArr[i];
                for (let c = 0, cLen = removeSpanArr.length, rowSpanCell; c < cLen; c++) {
                    rowSpanCell = removeSpanArr[c];

                    if (row.i >= rowSpanCell.i && row.i <= rowSpanCell.rs) {
                        rowSpanCell.cell.rowSpan -= 1;
                    }
                }
            }

            this.controllersOff();
        } else {
            this.plugins.table.setPositionControllerDiv.call(this, positionResetElement || contextTable._tdElement, true);
        }
    },

    _closeSplitMenu: null,
    openSplitMenu: function () {
        this.context.table.splitMenu.style.display = 'inline-table';

        this.plugins.table._closeSplitMenu = function () {
            this.context.table.splitMenu.style.display = 'none';
            this._d.removeEventListener('mousedown', this.plugins.table._closeSplitMenu);
            this.plugins.table._closeSplitMenu = null;
        }.bind(this);

        this._d.addEventListener('mousedown', this.plugins.table._closeSplitMenu);
    },

    splitCells: function (direction) {
        const vertical = direction === 'vertical';
        const contextTable = this.context.table;
        const currentCell = contextTable._tdElement;
        const rows = contextTable._trElements;
        const currentRow = contextTable._trElement;
        const index = contextTable._logical_cellIndex;
        const rowIndex = contextTable._rowIndex;

        const newCell = this.util.createElement(currentCell.nodeName);
        newCell.innerHTML = '<div>' + this.util.zeroWidthSpace + '</div>';

        // vertical
        if (vertical) {
            const currentColSpan = currentCell.colSpan;
            newCell.rowSpan = currentCell.rowSpan;

            // colspan - 0
            if (currentColSpan > 1) {
                newCell.colSpan = this._w.Math.floor(currentColSpan/2);
                currentCell.colSpan = currentColSpan - newCell.colSpan;
                currentRow.insertBefore(newCell, currentCell.nextElementSibling);
            } else { // colspan - n
                let rowSpanArr = [];
                let spanIndex = [];

                for (let i = 0, len = rows.length, cells, colSpan; i < len; i++) {
                    cells = rows[i].cells;
                    colSpan = 0;
                    if (i === rowIndex) continue;
                    for (let c = 0, cLen = cells.length, cell, cs, rs, logcalIndex; c < cLen; c++) {
                        cell = cells[c];
                        cs = cell.colSpan - 1;
                        rs = cell.rowSpan - 1;
                        logcalIndex = c + colSpan;

                        if (spanIndex.length > 0) {
                            for (let r = 0, arr; r < spanIndex.length; r++) {
                                arr = spanIndex[r];
                                if (logcalIndex >= arr.index) {
                                    colSpan += arr.cs;
                                    logcalIndex += arr.cs;
                                    arr.rs -= 1;
                                    if (arr.rs < 1) {
                                        spanIndex.splice(r, 1);
                                        r--;
                                    }  
                                }
                            }
                        }

                        if (logcalIndex <= index && rs > 0) {
                            rowSpanArr.push({
                                index: logcalIndex,
                                cs: cs + 1,
                                rs: rs,
                            });
                        }

                        if (logcalIndex <= index && logcalIndex + cs >= index + currentColSpan - 1) {
                            cell.colSpan += 1;
                            break;
                        }

                        if (logcalIndex > index) break;
                        
                        colSpan += cell.colSpan - 1;
                    }

                    spanIndex = spanIndex.concat(rowSpanArr).sort(function (a, b) {return a.index - b.index;});
                    rowSpanArr = [];
                }

                currentRow.insertBefore(newCell, currentCell.nextElementSibling);
            }
        } else { // horizontal
            const currentRowSpan = currentCell.rowSpan;
            newCell.colSpan = currentCell.colSpan;

            // rowspan - 0
            if (currentRowSpan > 1) {
                newCell.rowSpan = this._w.Math.floor(currentRowSpan/2);
                const newRowSpan = currentRowSpan - newCell.rowSpan;

                const rowSpanArr = [];
                const nextRowIndex = this.util.getArrayIndex(rows, currentRow) + newRowSpan;

                for (let i = 0, cells, colSpan; i < nextRowIndex; i++) {
                    cells = rows[i].cells;
                    colSpan = 0;
                    for (let c = 0, cLen = cells.length, cell, cs, logcalIndex; c < cLen; c++) {
                        logcalIndex = c + colSpan;
                        if (logcalIndex >= index) break;

                        cell = cells[c];
                        cs = cell.rowSpan - 1;
                        if (cs > 0 && cs + i >= nextRowIndex && logcalIndex < index) {
                            rowSpanArr.push({
                                index: logcalIndex,
                                cs: cell.colSpan
                            });
                        }
                        colSpan += cell.colSpan - 1;
                    }
                }

                const nextRow = rows[nextRowIndex];
                const nextCells = nextRow.cells;
                let rs = rowSpanArr.shift();

                for (let c = 0, cLen = nextCells.length, colSpan = 0, cell, cs, logcalIndex, insertIndex; c < cLen; c++) {
                    logcalIndex = c + colSpan;
                    cell = nextCells[c];
                    cs = cell.colSpan - 1;
                    insertIndex = logcalIndex + cs + 1;

                    if (rs && insertIndex >= rs.index) {
                        colSpan += rs.cs;
                        insertIndex += rs.cs;
                        rs = rowSpanArr.shift();
                    }
                    
                    if (insertIndex >= index) {
                        nextRow.insertBefore(newCell, cell.nextElementSibling);
                        break;
                    }

                    colSpan += cs;
                }

                currentCell.rowSpan = newRowSpan;
            } else { // rowspan - n
                newCell.rowSpan = currentCell.rowSpan;
                const newRow = this.util.createElement('TR');
                newRow.appendChild(newCell);

                for (let i = 0, cells; i < rowIndex; i++) {
                    cells = rows[i].cells;
                    if (cells.length === 0) return;

                    for (let c = 0, cLen = cells.length; c < cLen; c++) {
                        if (i + cells[c].rowSpan - 1 >= rowIndex) {
                            cells[c].rowSpan += 1;
                        }
                    }
                }

                const physicalIndex = contextTable._physical_cellIndex;
                const cells = currentRow.cells;

                for (let c = 0, cLen = cells.length; c < cLen; c++) {
                    if (c === physicalIndex) continue;       
                    cells[c].rowSpan += 1;                    
                }

                currentRow.parentNode.insertBefore(newRow, currentRow.nextElementSibling);
            }
        }

        this.plugins.table.setPositionControllerDiv.call(this, currentCell, true);
    },

    mergeCells: function () {
        const tablePlugin = this.plugins.table;
        const contextTable = this.context.table;

        const ref = tablePlugin._ref;
        const selectedCells = tablePlugin._selectedCells;
        const mergeCell = selectedCells[0];
        
        let emptyRowFirst = null;
        let emptyRowLast = null;
        let cs = ref.regCell.length;
        let rs = ref.regRow.length;
        let mergeHTML = '';
        let row = null;

        for (let i = 1, len = selectedCells.length, cell; i < len; i++) {
            cell = selectedCells[i];
            if (row !== cell.parentNode) row = cell.parentNode;

            mergeHTML += cell.innerHTML;
            this.util.removeItem(cell);

            if (row.cells.length === 0) {
                if (!emptyRowFirst) emptyRowFirst = row;
                else emptyRowLast = row;
                rs -= 1;
            }
        }

        if (emptyRowFirst) {
            const rows = contextTable._trElements;
            const rowIndexFirst = this.util.getArrayIndex(rows, emptyRowFirst);
            const rowIndexLast = this.util.getArrayIndex(rows, emptyRowLast || emptyRowFirst);
            const removeRows = [];
    
            for (let i = 0, cells; i <= rowIndexLast; i++) {
                cells = rows[i].cells;
                if (cells.length === 0) {
                    removeRows.push(rows[i]);
                    continue;
                }
    
                for (let c = 0, cLen = cells.length, cell; c < cLen; c++) {
                    cell = cells[c];
                    if (i + cell.rowSpan - 1 >= rowIndexFirst) {
                        cell.rowSpan = i + cell.rowSpan - rowIndexFirst;
                    }
                }
            }

            for (let i = 0, len = removeRows.length; i < len; i++) {
                this.util.removeItem(removeRows[i]);
            }
        }

        mergeCell.innerHTML += mergeHTML;
        mergeCell.colSpan = cs;
        mergeCell.rowSpan = rs;

        this.controllersOff();
        tablePlugin.setActiveButton.call(this, true, false);
        tablePlugin.call_controller_tableEdit.call(this, mergeCell);

        this.util.addClass(mergeCell, 'se-table-selected-cell');
    },

    toggleHeader: function () {
        const headerButton = this.context.table.headerButton;
        const active = this.util.hasClass(headerButton, 'on');
        const table = this.context.table._element;

        if (!active) {
            const header = this.util.createElement('THEAD');
            let th = '';
            for (let i = 0, len = this.context.table._logical_cellCnt; i < len; i++) {
                th += '<th><div>' + this.util.zeroWidthSpace + '</div></th>';
            }

            header.innerHTML = th;
            table.insertBefore(header, table.firstElementChild);
        } else {
            this.util.removeItem(table.querySelector('thead'));
        }

        this.util.toggleClass(headerButton, 'on');

        if (/TH/i.test(this.context.table._tdElement.nodeName)) {
            this.controllersOff();
        } else {
            this.plugins.table.setPositionControllerDiv.call(this, this.context.table._tdElement, false);
        }
    },

    resizeTable: function () {
        const contextTable = this.context.table;
        const icon =  contextTable.resizeIcon;
        const span = contextTable.resizeText;

        let removeClass = 'se-icon-expansion';
        let addClass = 'se-icon-reduction';
        let text = contextTable.minText;
        let width = '100%';

        if (!contextTable._maxWidth) {
            removeClass = 'se-icon-reduction';
            addClass = 'se-icon-expansion';
            text = contextTable.maxText;
            width = 'auto';
        }
        
        this.util.removeClass(icon, removeClass);
        this.util.addClass(icon, addClass);
        this.util.changeTxt(span, text);
        contextTable._element.style.width = width;
    },

    setActiveButton: function (fixedCell, selectedCell) {
        const contextTable = this.context.table;

        if (!selectedCell || fixedCell === selectedCell) {
            contextTable.splitButton.removeAttribute('disabled');
            contextTable.mergeButton.setAttribute('disabled', true);
        } else {
            contextTable.splitButton.setAttribute('disabled', true);
            contextTable.mergeButton.removeAttribute('disabled');
        }
    },

    _bindOnSelect: null,
    _bindOffSelect: null,
    _selectedCells: null,
    _fixedCell: null,
    _fixedCellName: null,
    _selectedCell: null,
    _selectedTable: null,
    _ref: null,
    _offCellMultiSelect: function (e) {
        e.stopPropagation();
        e.preventDefault();

        const tablePlugin = this.plugins.table;

        this.context.element.wysiwyg.setAttribute('contenteditable', true);
        this.util.removeClass(this.context.element.wysiwyg, 'se-disabled');

        this._d.removeEventListener('mousemove', tablePlugin._bindOnSelect);
        this._d.removeEventListener('mouseup', tablePlugin._bindOffSelect);
        tablePlugin._bindOnSelect = null;
        tablePlugin._bindOffSelect = null;
        
        tablePlugin.setActiveButton.call(this, tablePlugin._fixedCell, tablePlugin._selectedCell);
        tablePlugin.call_controller_tableEdit.call(this, tablePlugin._selectedCell || tablePlugin._fixedCell);

        tablePlugin._selectedCells = tablePlugin._selectedTable.querySelectorAll('.se-table-selected-cell');
        tablePlugin._fixedCell = null;
        tablePlugin._selectedCell = null;
        tablePlugin._fixedCellName = null;
    },

    _onCellMultiSelect: function (e) {
        const tablePlugin = this.plugins.table;
        const target = this.util.getParentElement(e.target, this.util.isCell);

        if (!tablePlugin._ref) {
            if (target === tablePlugin._fixedCell) {
                return;
            } else {
                this.context.element.wysiwyg.setAttribute('contenteditable', false);
                this.util.addClass(this.context.element.wysiwyg, 'se-disabled');
            }
        }

        if (!target || target === tablePlugin._selectedCell || tablePlugin._fixedCellName !== target.nodeName ||
                tablePlugin._selectedTable !== this.util.getParentElement(target, 'TABLE')) {
            return;
        }

        tablePlugin._selectedCell = target;
        tablePlugin.setMultiCells.call(this, tablePlugin._fixedCell, target);
    },

    _getMultiCellArr: function (ref) {
        const regCell = [];
        const regRow = [];

        for (let i = ref.cs, len = ref.ce; i <= len; i++) {
            regCell.push(i);
        }

        for (let i = ref.rs, len = ref.re; i <= len; i++) {
            regRow.push(i);
        }

        return {
            cell: regCell,
            row: regRow
        };
    },

    _checkCellIndex: function (ref, index, spanIndex) {
        for (let i = index, len = spanIndex; i <= len; i++) {
            if (ref.indexOf(i) > -1) return true;
        }

        return false;
    },

    setMultiCells: function (startCell, endCell) {
        const tablePlugin = this.plugins.table;
        const rows = tablePlugin._selectedTable.rows;

        const selectedCells = tablePlugin._selectedTable.querySelectorAll('.se-table-selected-cell');
        for (let i = 0, len = selectedCells.length; i < len; i++) {
            this.util.removeClass(selectedCells[i], 'se-table-selected-cell');
        }

        if (startCell === endCell) {
            this.util.addClass(startCell, 'se-table-selected-cell');
            return;
        }

        let findSelectedCell = true;
        let spanIndex = [];
        let rowSpanArr = [];
        const ref = tablePlugin._ref = {_i: 0, cs: null, ce: null, rs: null, re: null, regCell: null, regRow: null};

        for (let i = 0, len = rows.length, cells, colSpan; i < len; i++) {
            cells = rows[i].cells;
            colSpan = 0;

            for (let c = 0, cLen = cells.length, cell, logcalIndex, cs, rs, reg; c < cLen; c++) {
                cell = cells[c];
                cs = cell.colSpan - 1;
                rs = cell.rowSpan - 1;
                logcalIndex = c + colSpan;

                if (spanIndex.length > 0) {
                    for (let r = 0, arr; r < spanIndex.length; r++) {
                        arr = spanIndex[r];
                        if (arr.row > i) continue;
                        if (logcalIndex >= arr.index) {
                            colSpan += arr.cs;
                            logcalIndex += arr.cs;
                            arr.rs -= 1;
                            arr.row = i + 1;
                            if (arr.rs < 1) {
                                spanIndex.splice(r, 1);
                                r--;
                            }
                        } else if (c === cLen - 1) {
                            arr.rs -= 1;
                            arr.row = i + 1;
                            if (arr.rs < 1) {
                                spanIndex.splice(r, 1);
                            }
                        }
                    }
                }

                if (findSelectedCell) {
                    if (cell === startCell || cell === endCell) {
                        ref.cs = ref.cs !== null && ref.cs < logcalIndex ? ref.cs : logcalIndex;
                        ref.ce = ref.ce !== null && ref.ce > logcalIndex + cs ? ref.ce : logcalIndex + cs;
                        ref.rs = ref.rs !== null && ref.rs < i ? ref.rs : i;
                        ref.re = ref.re !== null && ref.re > i + rs ? ref.re : i + rs;

                        reg = tablePlugin._getMultiCellArr(ref);
                        ref.regCell = reg.cell;
                        ref.regRow = reg.row;

                        ref._i += 1;
                    }
                    
                    if (ref._i === 2) {
                        findSelectedCell = false;
                        spanIndex = [];
                        rowSpanArr = [];
                        i = -1;
                        break;
                    }
                } else if (tablePlugin._checkCellIndex(ref.regCell, logcalIndex, logcalIndex + cs) && tablePlugin._checkCellIndex(ref.regRow, i, i + rs)) {
                    const newCs = ref.cs < logcalIndex ? ref.cs : logcalIndex;
                    const newCe = ref.ce > logcalIndex + cs ? ref.ce : logcalIndex + cs;
                    const newRs = ref.rs < i ? ref.rs : i;
                    const newRe = ref.re > i + rs ? ref.re : i + rs;

                    if (ref.cs !== newCs || ref.ce !== newCe || ref.rs !== newRs || ref.re !== newRe) {
                        ref.cs = newCs;
                        ref.ce = newCe;
                        ref.rs = newRs;
                        ref.re = newRe;

                        reg = tablePlugin._getMultiCellArr(ref);
                        ref.regCell = reg.cell;
                        ref.regRow = reg.row;

                        spanIndex = [];
                        rowSpanArr = [];
                        i = -1;
                        break;
                    }

                    this.util.addClass(cell, 'se-table-selected-cell');
                }

                if (rs > 0) {
                    rowSpanArr.push({
                        index: logcalIndex,
                        cs: cs + 1,
                        rs: rs,
                        row: -1
                    });
                }

                colSpan += cell.colSpan - 1;
            }

            spanIndex = spanIndex.concat(rowSpanArr).sort(function (a, b) {return a.index - b.index;});
            rowSpanArr = [];
        }
    },

    tableCellMultiSelect: function (tdElement) {
        const tablePlugin = this.plugins.table;

        if (tablePlugin._bindOnSelect || tablePlugin._bindOffSelect) {
            this._d.removeEventListener('mousemove', tablePlugin._bindOnSelect);
            this._d.removeEventListener('mouseup', tablePlugin._bindOffSelect);
            tablePlugin._bindOnSelect = null;
            tablePlugin._bindOffSelect = null;
        }

        tablePlugin._fixedCell = tdElement;
        tablePlugin._fixedCellName = tdElement.nodeName;
        tablePlugin._selectedTable = this.util.getParentElement(tdElement, 'TABLE');

        const selectedCells = tablePlugin._selectedTable.querySelectorAll('.se-table-selected-cell');
        for (let i = 0, len = selectedCells.length; i < len; i++) {
            this.util.removeClass(selectedCells[i], 'se-table-selected-cell');
        }

        this.util.addClass(tdElement, 'se-table-selected-cell');
        
        tablePlugin._bindOnSelect = tablePlugin._onCellMultiSelect.bind(this);
        tablePlugin._bindOffSelect = tablePlugin._offCellMultiSelect.bind(this);

        this._d.addEventListener('mousemove', tablePlugin._bindOnSelect, false);
        this._d.addEventListener('mouseup', tablePlugin._bindOffSelect, false);
    },

    onClick_tableController: function (e) {
        e.stopPropagation();
        const target = e.target.getAttribute('data-command') ? e.target : e.target.parentNode;

        if (target.getAttribute('disabled')) return;

        const command = target.getAttribute('data-command');
        const value = target.getAttribute('data-value');
        const option = target.getAttribute('data-option');
        
        if (typeof this.plugins.table._closeSplitMenu === 'function') {
            this.plugins.table._closeSplitMenu();
            if (command === 'onsplit') return;
        }

        if (!command) return;

        e.preventDefault();
        const contextTable = this.context.table;

        switch (command) {
            case 'insert':
            case 'delete':
                this.plugins.table.editTable.call(this, value, option);
                break;
            case 'header':
                this.plugins.table.toggleHeader.call(this);
                break;
            case 'onsplit':
                this.plugins.table.openSplitMenu.call(this);
                break;
            case 'split':
                this.plugins.table.splitCells.call(this, value);
                break;
            case 'merge':
                this.plugins.table.mergeCells.call(this);
                break;
            case 'resize':
                contextTable.resizeDiv.style.display = 'none';
                contextTable._maxWidth = !contextTable._maxWidth;
                this.plugins.table.resizeTable.call(this);
                break;
            case 'remove':
                this.util.removeItem(contextTable._element);
                this.controllersOff();
        }

        // history stack
        this.history.push();
    }
};
