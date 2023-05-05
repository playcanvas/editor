import { Container, SelectInput, NumericInput, BooleanInput, Button } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-animstategraph-condition';

class AnimstategraphCondition extends Container {
    /**
     * Creates a new condition.
     *
     * @param {object} [args] - The arguments
     */
    constructor(args) {
        args = Object.assign({
            class: CLASS_ROOT
        }, args);

        super(args);
        this._args = args;

        this.class.add(CLASS_ROOT);
    }

    link(assets, path) {
        if (!assets[0].get(path)) return;
        const selectParameterName = new SelectInput({
            type: 'string',
            options: this._args.parameters.map((param) => { return { v: param, t: param }; }),
            value: assets[0].get(path).parameterName
        });
        selectParameterName.on('change', (value) => {
            const condition = assets[0].get(path);
            condition.parameterName = value;
            const params = assets[0].latest().get('data.parameters');
            Object.keys(params).forEach((paramKey) => {
                const param = params[paramKey];
                if (param.name === condition.parameterName && [ANIM_PARAMETER_BOOLEAN, ANIM_PARAMETER_TRIGGER].includes(param.type)) {
                    condition.value = true;
                }
            });
            assets[0].set(path, condition);
        });
        this.append(selectParameterName);

        let shouldSelectPredicate;
        Object.keys(assets[0].get('data.parameters')).forEach((paramKey) => {
            const param = assets[0].get('data.parameters')[paramKey];
            if (param.name === assets[0].get(path).parameterName && [ANIM_PARAMETER_INTEGER, ANIM_PARAMETER_FLOAT].includes(param.type)) {
                shouldSelectPredicate = true;
            }
        });
        const selectPredicate = new SelectInput({
            type: 'string',
            options: [
                {
                    v: ANIM_EQUAL_TO,
                    t: '=='
                },
                {
                    v: ANIM_NOT_EQUAL_TO,
                    t: '!='
                },
                {
                    v: ANIM_LESS_THAN,
                    t: '<'
                },
                {
                    v: ANIM_LESS_THAN_EQUAL_TO,
                    t: '<='
                },
                {
                    v: ANIM_GREATER_THAN,
                    t: '>'
                },
                {
                    v: ANIM_GREATER_THAN_EQUAL_TO,
                    t: '>='
                }
            ],
            value: assets[0].get(path).predicate
        });
        selectPredicate.on('change', (value) => {
            const condition = assets[0].get(path);
            condition.predicate = value;
            assets[0].set(path, condition);
        });
        this.append(selectPredicate);
        if (!shouldSelectPredicate) {
            selectPredicate.enabled = false;
        } else {
            selectPredicate.enabled = true;
        }
        const condition = assets[0].get(path);
        const parameters = assets[0].get('data.parameters');
        const parameter = Object.keys(parameters).map(key => parameters[key]).filter(param => param.name === condition.parameterName)[0];
        if (parameter) {
            if ([ANIM_PARAMETER_FLOAT, ANIM_PARAMETER_INTEGER].includes(parameter.type)) {
                const valueInput = new NumericInput({
                    value: assets[0].get(path).value,
                    precision: parameter.type === ANIM_PARAMETER_INTEGER ? 0 : undefined,
                    hideSlider: true
                });
                valueInput.on('change', (value) => {
                    const condition = assets[0].get(path);
                    condition.value = value;
                    assets[0].set(path, condition);
                });
                this.append(valueInput);
            } else {
                const valueInput = new BooleanInput({
                    value: assets[0].get(path).value
                });
                valueInput.on('change', (value) => {
                    const condition = assets[0].get(path);
                    condition.value = value;
                    assets[0].set(path, condition);
                });
                if (parameter.type === ANIM_PARAMETER_TRIGGER) {
                    valueInput.enabled = false;
                }
                this.append(valueInput);
            }
        }
        const removeButton = new Button({
            icon: 'E289'
        });
        removeButton.on('click', () => {
            this._args.onDelete();
        });
        this.append(removeButton);
    }
}

export { AnimstategraphCondition };
