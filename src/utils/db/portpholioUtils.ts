import * as PrismaTypes from '.prisma/client'

export const getPortpholioById = async function getPortpholioById(
  id: bigint,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.Portpholio> {
  const portpholio: PrismaTypes.Portpholio | null =
    await prisma.portpholio.findUnique({
      where: {
        id: id,
      },
    })

  if (!portpholio) {
    throw new Error("Portpholio don't exists.")
  }

  return portpholio
}
