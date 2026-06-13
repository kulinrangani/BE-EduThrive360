import * as orgService from "../services/organization.service.js";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/errors.js";

export async function create(req, res, next) {
  try {
    const result = await orgService.createOrganization(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const organization = await orgService.updateOrganization(req.params.id, req.body, req.user);
    res.json({ organization });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const organizations = await orgService.listOrganizations(req.user, req.query);
    res.json({ organizations });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const organization = await orgService.getMyOrganization(req.user);
    res.json({ organization });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const organization = await orgService.getOrganizationById(req.params.id, req.user);
    res.json({ organization });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function listMembers(req, res, next) {
  try {
    const members = await orgService.listOrgMembers(req.params.id, req.user, req.query);
    res.json({ members });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function addMember(req, res, next) {
  try {
    const user = await orgService.addMember(req.params.id, req.body, req.user);
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function getMember(req, res, next) {
  try {
    const user = await orgService.getOrgMember(req.params.id, req.params.userId, req.user);
    res.json({ user });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function updateMember(req, res, next) {
  try {
    const user = await orgService.updateOrgMember(
      req.params.id,
      req.params.userId,
      req.body,
      req.user,
    );
    res.json({ user });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function deleteMember(req, res, next) {
  try {
    const result = await orgService.deleteOrgMember(
      req.params.id,
      req.params.userId,
      req.user,
    );
    if (result.deleted) {
      return res.json(result);
    }
    res.json({ user: result });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function deleteOrg(req, res, next) {
  try {
    const result = await orgService.deleteOrganization(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

