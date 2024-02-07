// document.querySelector('.input_type_range .input_type_range_handle').getBoundingClientRect().width
import { useEffect, useReducer } from "react"

const rangeSliderReducer = (state, action) => {
    switch (action.type) {
        case "CLEAR":
            return {
                isActive: false,
                option_id: '',
                option_title: ''
            }
        default:
          const newOne = { ...state, ...action }
          return newOne
    }
  }

function RangeSlider({ optn, option_index, selectedOptions, onSelectOption }) {

    const the_value_index = optn.option_values.findIndex(oov => oov.option_value_id === selectedOptions[option_index]?.option_value_id)
    const the_value = optn.option_values[the_value_index]?.option_value_title
    console.log('the_value', the_value)

    const dividation = 100 / optn.option_values.length
    const dividation_of_single_dividation = dividation / ( optn.option_values.length - 1 )


    const progress_array = optn.option_values.map((optn_option_value, optn_option_value_index) => {
        let left_value = 0
        if (optn_option_value_index === 0) {
            left_value = 0
        } else if ( ( 1 + optn_option_value_index ) === optn.option_values.length ) {
            left_value = 100
        } else if ( optn_option_value_index > 0 && optn_option_value_index < 100 ) {
            left_value = ( dividation + dividation_of_single_dividation ) * optn_option_value_index
        }
        return left_value
    })
    console.log('progress_array', progress_array)

    const [rangeSliderData, dispatchRangeSliderData] = useReducer(rangeSliderReducer, {
        isMouseDown: false,
        isMouseMove: false,
        pageX: '',
        handlePosition: 0,
    })

    useEffect(() => {
        console.log('useEffect rangeSliderData', rangeSliderData)
    }, [rangeSliderData])

    return (
        <>
            <legend>{optn.option_title}:</legend>

            <div className="input_type_range">
                <div
                    id=""
                    className="input_type_range_handle"
                    style={{
                        left: `${progress_array[rangeSliderData.handlePosition]}%`
                    }}
                    onMouseDown={(mouseDownEvent) => {
                        dispatchRangeSliderData({ isMouseDown: true, pageX: mouseDownEvent.pageX })
                    }}
                    onMouseMove={(onMouseMoveEvent) => {
                        if ((rangeSliderData.pageX > onMouseMoveEvent.pageX) && rangeSliderData.isMouseDown) {
                            // Left
                            dispatchRangeSliderData({
                                isMouseMove: true,
                                handlePosition: (rangeSliderData.handlePosition >= 1) ? rangeSliderData.handlePosition - 1 : 0
                            })
                        } else if ((rangeSliderData.pageX < onMouseMoveEvent.pageX) && rangeSliderData.isMouseDown) {
                            // Right
                            dispatchRangeSliderData({
                                isMouseMove: true,
                                handlePosition: (rangeSliderData.handlePosition < optn.option_values.length - 1) ? rangeSliderData.handlePosition + 1 : 0
                            })
                        }
                    }}
                    onMouseUp={(mouseUpEvent) => {
                        console.log('mouseUpEvent', mouseUpEvent)
                        dispatchRangeSliderData({ isMouseDown: false, pageX: mouseUpEvent.pageX })
                    }}
                >
                    {the_value}
                </div>
                {
                    optn.option_values.map((optn_option_value, optn_option_value_index) => {
                        return (
                            <span className="input_type_range_tick_mark" style={{
                                left: `${progress_array[optn_option_value_index]}%`
                            }}>
                                {
                                    ( optn_option_value_index === 0 || ( optn_option_value_index === ( optn.option_values.length - 1 ) ) )
                                    ?
                                    <sub
                                        className={
                                            (optn_option_value_index === 0) ? 'left_sub' : 'right_sub'
                                        }
                                    >
                                        {optn_option_value.option_value_title}
                                    </sub>
                                    :
                                    <></>
                                }
                            </span>
                        )
                    })
                }
            </div>

            <input
                type="range"
                name={`properties[${optn.option_title}]`}
                id={optn.option_id}
                min={0}
                max={optn.option_values.length-1}
                step={1}
                onChange={(event) => {
                    const option_value = optn.option_values[event.target.value]
                    onSelectOption(option_index, optn, option_value)
                }}
                value={the_value_index}
                list={`${optn.option_id}_list`}
            />

            <datalist id={`${optn.option_id}_list`}>
                {
                    optn.option_values.map((oov, oov_index) => {
                        return (
                            <option value={oov_index} label={optn.option_values[oov_index].option_value_title}></option>
                        )
                    })
                }
            </datalist>

        </>
    )
}

export default RangeSlider