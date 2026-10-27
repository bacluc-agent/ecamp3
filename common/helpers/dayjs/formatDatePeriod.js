export default (option, dayjsClass, dayjsFactory) => {
  dayjsFactory.formatDatePeriod = (start, end, format, _ /* locale */) => {
    if (!format) return ''
    const s = (start && start.format) ? start.format(format) : String(start)
    const e = (end && end.format) ? end.format(format) : String(end)
    return `${s} - ${e}`
  }
}
