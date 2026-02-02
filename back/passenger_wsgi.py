import os, sys

BASE_DIR = os.path.dirname(__file__)
sys.path.insert(0, BASE_DIR)  # если app/ в корне
# sys.path.insert(0, os.path.join(BASE_DIR, "back"))  # если app/ внутри back

from app.main import app
from a2wsgi import ASGIMiddleware

application = ASGIMiddleware(app)