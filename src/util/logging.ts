
import { Logger as TsLogger } from 'tslog'

export const Logger = (fileName: string) => new TsLogger({ name: __filename })