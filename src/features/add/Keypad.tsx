interface KeypadProps {
  isEditing: boolean;
  onPress: (key: string) => void;
  onSave: (keepOpen: boolean) => void;
}

export function Keypad({ isEditing, onPress, onSave }: KeypadProps) {
  return (
    <div className="keypad" role="group" aria-label="金额数字键盘">
      <button type="button" className="key num" data-key="1" onClick={() => onPress('1')}>1</button>
      <button type="button" className="key num" data-key="2" onClick={() => onPress('2')}>2</button>
      <button type="button" className="key num" data-key="3" onClick={() => onPress('3')}>3</button>
      <button
        type="button"
        className="key"
        data-key="del"
        aria-label="删除"
        onClick={() => onPress('del')}
      >
        ⌫
      </button>

      <button type="button" className="key num" data-key="4" onClick={() => onPress('4')}>4</button>
      <button type="button" className="key num" data-key="5" onClick={() => onPress('5')}>5</button>
      <button type="button" className="key num" data-key="6" onClick={() => onPress('6')}>6</button>
      <button
        type="button"
        className="key op"
        data-key="+"
        aria-label="加"
        onClick={() => onPress('+')}
      >
        +
      </button>

      <button type="button" className="key num" data-key="7" onClick={() => onPress('7')}>7</button>
      <button type="button" className="key num" data-key="8" onClick={() => onPress('8')}>8</button>
      <button type="button" className="key num" data-key="9" onClick={() => onPress('9')}>9</button>
      <button
        type="button"
        className="key op"
        data-key="-"
        aria-label="减"
        onClick={() => onPress('-')}
      >
        −
      </button>

      <button type="button" className="key num" data-key="." onClick={() => onPress('.')}>.</button>
      <button type="button" className="key num" data-key="0" onClick={() => onPress('0')}>0</button>

      {!isEditing ? (
        <>
          <button
            type="button"
            className="key small"
            data-key="again"
            onClick={() => onSave(true)}
          >
            再记
          </button>
          <button
            type="button"
            className="key done"
            data-key="done"
            onClick={() => onSave(false)}
          >
            完成
          </button>
        </>
      ) : (
        <button
          type="button"
          className="key done"
          style={{ gridColumn: 'span 2' }}
          data-key="done"
          onClick={() => onSave(false)}
        >
          保存
        </button>
      )}
    </div>
  );
}
