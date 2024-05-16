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
    // console.log('the_value', the_value)

    const dividation = 100 / optn.option_values.length
    const dividation_of_single_dividation = dividation / ( optn.option_values.length - 1 )
    console.log('dividation_of_single_dividation', dividation_of_single_dividation)

    const tick_mark_positions = optn.option_values.map((optn_option_value, optn_option_value_index) => {
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
    console.log('tick_mark_positions', tick_mark_positions)

    const [rangeSliderData, dispatchRangeSliderData] = useReducer(rangeSliderReducer, {
        isMouseDown: false,
        isMouseMove: false,
        pageX: '',
        handlePosition: 0,
    })
    console.log('rangeSliderData', rangeSliderData)


    // mousedown mouseup start
    useEffect(() => {
        console.log('useEffect mousedown mouseup optn.option_title', optn.option_title)

        const handleWindowMouseDown = (mouseDownEvent) => {
            if (
                !!mouseDownEvent.target.id &&
                (`input_type_range_handle_${optn.option_id}` === mouseDownEvent.target.id)
            ) {
                dispatchRangeSliderData({ isMouseDown: true, isMouseMove: false, pageX: mouseDownEvent.pageX })
            }
        }

        const handleWindowMouseUp = (mouseUpEvent) => {
            console.log('handleWindowMouseUp rangeSliderData', rangeSliderData)
            if (rangeSliderData.isMouseDown) {
            }
            dispatchRangeSliderData({ isMouseDown: false, pageX: mouseUpEvent.pageX })
        }

        window.addEventListener('mousedown', handleWindowMouseDown)
        window.addEventListener('mouseup', handleWindowMouseUp)

        return () => {
            window.removeEventListener('mousedown', handleWindowMouseDown)
            window.removeEventListener('mouseup', handleWindowMouseUp)
        }
    }, [])
    // mousedown mouseup end


    // mousemove
    useEffect(() => {
        console.log('useEffect mousemove optn.option_title', optn.option_title)

        const handleWindowMouseMove = (onMouseMoveEvent) => {
            if (rangeSliderData.isMouseDown) {
                const input_type_range_tick_marks = document.querySelectorAll(`#input_type_range_${optn.option_id} span.input_type_range_tick_mark`)
                const tick_marks_x_coordinates = []
                for ( let index = 0; index < input_type_range_tick_marks.length; index++ ) {
                    const input_type_range_tick_mark = input_type_range_tick_marks[index]
                    tick_marks_x_coordinates.push(
                        Math.sqrt((onMouseMoveEvent.pageX - input_type_range_tick_mark.getBoundingClientRect().x) ** 2)
                    )
                }
                const min_diff = Math.min.apply( Math, tick_marks_x_coordinates )
                const min_diff_index = tick_marks_x_coordinates.findIndex(tmxc => tmxc === min_diff)
                dispatchRangeSliderData({
                    isMouseMove: true,
                    handlePosition: min_diff_index
                })

                onSelectOption(option_index, optn, optn.option_values[min_diff_index])
            }
        }

        window.addEventListener('mousemove', handleWindowMouseMove)

        return () => window.removeEventListener('mousemove', handleWindowMouseMove)
    }, [rangeSliderData])


    return (
        <>
            <legend>{optn.option_title}:</legend>

            <div id={`input_type_range_${optn.option_id}`} className="input_type_range">
                <div
                    id={`input_type_range_handle_${optn.option_id}`}
                    className="input_type_range_handle"
                    style={{
                        left: `${tick_mark_positions[rangeSliderData.handlePosition]}%`
                    }}
                >
                    {the_value}
                </div>
                {
                    optn.option_values.map((optn_option_value, optn_option_value_index) => {
                        return (
                            <span id={`input_type_range_tick_mark_${optn.option_id}`} className="input_type_range_tick_mark" style={{
                                left: `${tick_mark_positions[optn_option_value_index]}%`
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

            {/* <input
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
            </datalist> */}

        </>
    )
}

export default RangeSlider