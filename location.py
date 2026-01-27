import geocoder

def get_current_location():
    g = geocoder.ip('me')
    if g.ok:
        return g.latlng[0], g.latlng[1], g.state
    return None, None, None