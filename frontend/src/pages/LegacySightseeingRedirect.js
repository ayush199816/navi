import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getGuestSightseeingById } from '../redux/slices/guestSightseeingSlice';
import { buildSightseeingUrl } from '../utils/sightseeingUrl';

const LegacySightseeingRedirect = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        if (!id) {
          navigate('/tours', { replace: true });
          return;
        }

        const sightseeing = await dispatch(getGuestSightseeingById(id)).unwrap();
        if (!isMounted || !sightseeing) return;

        navigate(buildSightseeingUrl(sightseeing), { replace: true });
      } catch (e) {
        if (!isMounted) return;
        navigate('/tours', { replace: true });
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [dispatch, id, navigate]);

  return null;
};

export default LegacySightseeingRedirect;
