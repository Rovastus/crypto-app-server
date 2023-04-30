import { Decimal } from '@prisma/client/runtime/library'

export const getAvcoValue = function getBinanceCoinPairs(
  weight1: Decimal,
  value1: Decimal,
  weight2: Decimal,
  value2: Decimal,
): Decimal {
  const total1 = weight1.mul(value1).toDecimalPlaces(8)
  const total2 = weight2.mul(value2).toDecimalPlaces(8)
  const totalSum = total1.plus(total2).toDecimalPlaces(8)
  const weightSum = weight1.plus(weight2).toDecimalPlaces(8)
  return totalSum.div(weightSum).toDecimalPlaces(8)
}
