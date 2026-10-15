import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { cuentasService } from '../services/cuentas.service';

export const getBancos = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bancos = await cuentasService.getBancos();
    res.status(200).json(bancos);
  } catch (error) {
    next(error);
  }
};

export const getCuentas = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const cuentas = await cuentasService.getCuentas(id_usuario);
    res.status(200).json(cuentas);
  } catch (error) {
    next(error);
  }
};

export const createCuenta = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const nuevaCuenta = await cuentasService.createCuenta(id_usuario, req.body);
    res.status(201).json(nuevaCuenta);
  } catch (error) {
    next(error);
  }
};

export const validarCuenta = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const numero_cuenta =
      req.body?.numero_cuenta ||
      req.params?.numero_cuenta ||
      (req.query?.numero_cuenta as string);

    const banco = req.body?.banco || (req.query?.banco as string);
    const esInterbancaria =
      req.body?.es_interbancaria === true ||
      (banco && !banco.toLowerCase().includes('prestige'));

    // Si se especifica que es interbancaria o de otro banco, se valida en la tabla de simulación
    if (esInterbancaria) {
      const verified = await cuentasService.validarCuentaInterbancaria(numero_cuenta, banco);
      res.status(200).json({
        valida: true,
        tipo: 'interbancaria',
        cuenta: verified,
      });
      return;
    }

    const verifiedAccount = await cuentasService.validarCuenta(numero_cuenta);
    res.status(200).json({
      valida: true,
      tipo: 'local',
      cuenta: verifiedAccount,
    });
  } catch (error) {
    next(error);
  }
};

export const validarCuentaInterbancaria = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const numero_cuenta =
      req.body?.numero_cuenta ||
      req.params?.numero_cuenta ||
      (req.query?.numero_cuenta as string);

    const banco = req.body?.banco || (req.query?.banco as string);

    const verified = await cuentasService.validarCuentaInterbancaria(numero_cuenta, banco);
    res.status(200).json({
      valida: true,
      tipo: 'interbancaria',
      cuenta: verified,
    });
  } catch (error) {
    next(error);
  }
};

export const transferir = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const resultado = await cuentasService.realizarTransferencia(id_usuario, req.body);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

export const transferirInterbancaria = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const resultado = await cuentasService.realizarTransferenciaInterbancaria(id_usuario, req.body);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};
